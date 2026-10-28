using DevTaskHub.Api.Data;
using DevTaskHub.Api.Domain;
using DevTaskHub.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace DevTaskHub.Api.Services;

public class TaskService : ITaskService
{
    private readonly AppDbContext _db;

    public TaskService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<TaskSummaryDto>> GetTasksAsync(
        int currentUserId, bool isAdmin, TaskQueryParameters query, CancellationToken ct)
    {
        var q = _db.Tasks.AsNoTracking();

        // Developer scoping: only tasks in projects where user is owner or member
        if (!isAdmin)
        {
            q = q.Where(t => t.Project.OwnerUserId == currentUserId || 
                             t.Project.Members.Any(m => m.UserId == currentUserId));
        }

        if (query.ProjectId.HasValue)
        {
            q = q.Where(t => t.ProjectId == query.ProjectId.Value);
        }

        if (query.AssigneeId.HasValue)
        {
            q = q.Where(t => t.AssigneeUserId == query.AssigneeId.Value);
        }

        if (query.Mine == true)
        {
            q = q.Where(t => t.AssigneeUserId == currentUserId);
        }

        if (query.Status.HasValue)
        {
            q = q.Where(t => t.Status == query.Status.Value);
        }

        if (query.Priority.HasValue)
        {
            q = q.Where(t => t.Priority == query.Priority.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            q = q.Where(t => t.Title.ToLower().Contains(term) || (t.Description != null && t.Description.ToLower().Contains(term)));
        }

        var totalCount = await q.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalCount / (double)query.PageSize);

        var items = await q
            .OrderByDescending(t => t.UpdatedAtUtc)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(t => new TaskSummaryDto(
                t.Id,
                t.ProjectId,
                t.Project.Key,
                t.Project.Name,
                t.Title,
                t.Status.ToString(),
                t.Priority.ToString(),
                t.AssigneeUserId,
                t.Assignee != null ? t.Assignee.FullName : null,
                t.CreatedByUserId,
                t.CreatedBy.FullName,
                t.DueDateUtc,
                t.CompletedAtUtc,
                t.CreatedAtUtc,
                t.UpdatedAtUtc
            ))
            .ToListAsync(ct);

        return new PagedResult<TaskSummaryDto>(
            items,
            query.Page,
            query.PageSize,
            totalCount,
            totalPages,
            query.Page < totalPages,
            query.Page > 1
        );
    }

    public async Task<TaskDetailDto> GetTaskByIdAsync(int id, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        var task = await _db.Tasks
            .AsNoTracking()
            .Include(t => t.Project)
                .ThenInclude(p => p.Members)
            .Include(t => t.Assignee)
            .Include(t => t.CreatedBy)
            .FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new KeyNotFoundException($"Task #{id} not found.");

        ValidateProjectAccess(task.Project, currentUserId, isAdmin);

        return MapToDetailDto(task);
    }

    public async Task<TaskDetailDto> CreateTaskAsync(CreateTaskRequest request, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        var project = await _db.Projects
            .Include(p => p.Members)
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
            ?? throw new KeyNotFoundException($"Project #{request.ProjectId} not found.");

        ValidateProjectAccess(project, currentUserId, isAdmin);

        // Check Assignee is a member of the project
        if (request.AssigneeUserId.HasValue)
        {
            ValidateAssigneeMembership(project, request.AssigneeUserId.Value);
        }

        var task = new TaskItem
        {
            ProjectId = request.ProjectId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Priority = request.Priority,
            Status = TaskItemStatus.ToDo,
            AssigneeUserId = request.AssigneeUserId,
            CreatedByUserId = currentUserId,
            DueDateUtc = request.DueDateUtc,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync(ct);

        // Log creation activity
        await LogActivityAsync(task.Id, task.ProjectId, TaskActivityAction.Created, null, task.Title, currentUserId, ct);

        if (task.AssigneeUserId.HasValue)
        {
            var assignee = await _db.Users.FindAsync([task.AssigneeUserId.Value], ct);
            await LogActivityAsync(task.Id, task.ProjectId, TaskActivityAction.Assigned, null, assignee?.FullName, currentUserId, ct);
        }

        return await GetTaskByIdAsync(task.Id, currentUserId, isAdmin, ct);
    }

    public async Task<TaskDetailDto> UpdateTaskAsync(
        int id, UpdateTaskRequest request, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        var task = await _db.Tasks
            .Include(t => t.Project)
                .ThenInclude(p => p.Members)
            .FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new KeyNotFoundException($"Task #{id} not found.");

        ValidateProjectAccess(task.Project, currentUserId, isAdmin);

        if (task.Title != request.Title.Trim())
        {
            await LogActivityAsync(task.Id, task.ProjectId, TaskActivityAction.TitleEdited, task.Title, request.Title.Trim(), currentUserId, ct);
            task.Title = request.Title.Trim();
        }

        if (task.Description != request.Description?.Trim())
        {
            await LogActivityAsync(task.Id, task.ProjectId, TaskActivityAction.DescriptionEdited, task.Description, request.Description?.Trim(), currentUserId, ct);
            task.Description = request.Description?.Trim();
        }

        if (task.Priority != request.Priority)
        {
            await LogActivityAsync(task.Id, task.ProjectId, TaskActivityAction.PriorityChanged, task.Priority.ToString(), request.Priority.ToString(), currentUserId, ct);
            task.Priority = request.Priority;
        }

        if (task.DueDateUtc != request.DueDateUtc)
        {
            await LogActivityAsync(task.Id, task.ProjectId, TaskActivityAction.DueDateChanged, task.DueDateUtc?.ToString("o"), request.DueDateUtc?.ToString("o"), currentUserId, ct);
            task.DueDateUtc = request.DueDateUtc;
        }

        task.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return await GetTaskByIdAsync(task.Id, currentUserId, isAdmin, ct);
    }

    public async Task<TaskDetailDto> ChangeStatusAsync(
        int id, ChangeTaskStatusRequest request, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        var task = await _db.Tasks
            .Include(t => t.Project)
                .ThenInclude(p => p.Members)
            .FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new KeyNotFoundException($"Task #{id} not found.");

        ValidateProjectAccess(task.Project, currentUserId, isAdmin);

        var currentStatus = task.Status;
        var targetStatus = request.Status;

        if (currentStatus == targetStatus) return await GetTaskByIdAsync(task.Id, currentUserId, isAdmin, ct);

        // State Machine validation
        var isValid = (currentStatus, targetStatus) switch
        {
            (TaskItemStatus.ToDo, TaskItemStatus.InProgress) => true,
            (TaskItemStatus.InProgress, TaskItemStatus.InReview) => true,
            (TaskItemStatus.InProgress, TaskItemStatus.ToDo) => true,
            (TaskItemStatus.InReview, TaskItemStatus.Done) => true,
            (TaskItemStatus.InReview, TaskItemStatus.InProgress) => true,
            // Reopen rule: Only Admin or Assignee can move from Done -> InProgress
            (TaskItemStatus.Done, TaskItemStatus.InProgress) => isAdmin || task.AssigneeUserId == currentUserId,
            _ => false
        };

        if (!isValid)
        {
            throw new ArgumentException($"Invalid status transition from '{currentStatus}' to '{targetStatus}'.");
        }

        task.Status = targetStatus;
        task.UpdatedAtUtc = DateTime.UtcNow;

        if (targetStatus == TaskItemStatus.Done)
        {
            task.CompletedAtUtc = DateTime.UtcNow;
        }
        else if (currentStatus == TaskItemStatus.Done)
        {
            task.CompletedAtUtc = null;
        }

        var action = (currentStatus == TaskItemStatus.Done && targetStatus == TaskItemStatus.InProgress)
            ? TaskActivityAction.Reopened
            : TaskActivityAction.StatusChanged;

        await LogActivityAsync(task.Id, task.ProjectId, action, currentStatus.ToString(), targetStatus.ToString(), currentUserId, ct);
        await _db.SaveChangesAsync(ct);

        return await GetTaskByIdAsync(task.Id, currentUserId, isAdmin, ct);
    }

    public async Task<TaskDetailDto> AssignTaskAsync(
        int id, AssignTaskRequest request, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        var task = await _db.Tasks
            .Include(t => t.Project)
                .ThenInclude(p => p.Members)
            .Include(t => t.Assignee)
            .FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new KeyNotFoundException($"Task #{id} not found.");

        ValidateProjectAccess(task.Project, currentUserId, isAdmin);

        if (task.AssigneeUserId == request.AssigneeUserId)
        {
            return await GetTaskByIdAsync(task.Id, currentUserId, isAdmin, ct);
        }

        var oldAssigneeName = task.Assignee?.FullName;
        string? newAssigneeName = null;

        if (request.AssigneeUserId.HasValue)
        {
            ValidateAssigneeMembership(task.Project, request.AssigneeUserId.Value);
            var newAssignee = await _db.Users.FindAsync([request.AssigneeUserId.Value], ct)
                ?? throw new KeyNotFoundException($"User #{request.AssigneeUserId.Value} not found.");
            newAssigneeName = newAssignee.FullName;
            task.AssigneeUserId = request.AssigneeUserId.Value;

            await LogActivityAsync(task.Id, task.ProjectId, TaskActivityAction.Assigned, oldAssigneeName, newAssigneeName, currentUserId, ct);
        }
        else
        {
            task.AssigneeUserId = null;
            await LogActivityAsync(task.Id, task.ProjectId, TaskActivityAction.Unassigned, oldAssigneeName, null, currentUserId, ct);
        }

        task.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return await GetTaskByIdAsync(task.Id, currentUserId, isAdmin, ct);
    }

    public async Task DeleteTaskAsync(int id, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        var task = await _db.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new KeyNotFoundException($"Task #{id} not found.");

        ValidateProjectAccess(task.Project, currentUserId, isAdmin);

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<TaskActivityLogDto>> GetActivityLogsAsync(
        int taskId, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        var task = await _db.Tasks
            .Include(t => t.Project)
                .ThenInclude(p => p.Members)
            .FirstOrDefaultAsync(t => t.Id == taskId, ct)
            ?? throw new KeyNotFoundException($"Task #{taskId} not found.");

        ValidateProjectAccess(task.Project, currentUserId, isAdmin);

        return await _db.TaskActivityLogs
            .AsNoTracking()
            .Where(a => a.TaskId == taskId)
            .OrderByDescending(a => a.CreatedAtUtc)
            .Select(a => new TaskActivityLogDto(
                a.Id,
                a.TaskId,
                a.Action.ToString(),
                a.OldValue,
                a.NewValue,
                a.ActorUserId,
                a.Actor.FullName,
                a.CreatedAtUtc
            ))
            .ToListAsync(ct);
    }

    private static void ValidateProjectAccess(Project project, int userId, bool isAdmin)
    {
        if (isAdmin) return;
        if (project.OwnerUserId == userId || project.Members.Any(m => m.UserId == userId)) return;
        throw new UnauthorizedAccessException("You do not have access to tasks in this project.");
    }

    private static void ValidateAssigneeMembership(Project project, int assigneeUserId)
    {
        var isMember = project.OwnerUserId == assigneeUserId || project.Members.Any(m => m.UserId == assigneeUserId);
        if (!isMember)
        {
            throw new ArgumentException("The assigned user must be a member of the project.");
        }
    }

    private Task LogActivityAsync(
        int taskId, int projectId, TaskActivityAction action, string? oldValue, string? newValue, int userId, CancellationToken ct)
    {
        var log = new TaskActivityLog
        {
            TaskId = taskId,
            ProjectId = projectId,
            Action = action,
            OldValue = oldValue,
            NewValue = newValue,
            ActorUserId = userId,
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.TaskActivityLogs.Add(log);
        return Task.CompletedTask;
    }

    private static TaskDetailDto MapToDetailDto(TaskItem task) =>
        new(
            task.Id,
            task.ProjectId,
            task.Project.Key,
            task.Project.Name,
            task.Title,
            task.Description,
            task.Status.ToString(),
            task.Priority.ToString(),
            task.AssigneeUserId,
            task.Assignee?.FullName,
            task.CreatedByUserId,
            task.CreatedBy.FullName,
            task.DueDateUtc,
            task.CompletedAtUtc,
            task.CreatedAtUtc,
            task.UpdatedAtUtc
        );
}
