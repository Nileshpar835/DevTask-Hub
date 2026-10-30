using DevTaskHub.Api.Data;
using DevTaskHub.Api.Domain;
using DevTaskHub.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace DevTaskHub.Api.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;

    public DashboardService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<AdminDashboardDto> GetAdminDashboardAsync(CancellationToken ct)
    {
        var totalProjects = await _db.Projects.CountAsync(ct);
        var totalActiveProjects = await _db.Projects.CountAsync(p => p.Status == ProjectStatus.Active, ct);
        var totalUsers = await _db.Users.CountAsync(ct);
        var totalDevelopers = await _db.Users.CountAsync(u => u.Role == UserRole.Developer, ct);
        var totalTasks = await _db.Tasks.CountAsync(ct);

        var now = DateTime.UtcNow;
        var overdueCount = await _db.Tasks
            .CountAsync(t => t.DueDateUtc != null && t.DueDateUtc < now && t.Status != TaskItemStatus.Done, ct);

        var statusCounts = await _db.Tasks
            .GroupBy(t => t.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count, ct);

        var breakdown = new TaskStatusBreakdownDto(
            statusCounts.GetValueOrDefault(TaskItemStatus.ToDo, 0),
            statusCounts.GetValueOrDefault(TaskItemStatus.InProgress, 0),
            statusCounts.GetValueOrDefault(TaskItemStatus.InReview, 0),
            statusCounts.GetValueOrDefault(TaskItemStatus.Done, 0)
        );

        var recentActivities = await _db.TaskActivityLogs
            .AsNoTracking()
            .OrderByDescending(a => a.CreatedAtUtc)
            .Take(6)
            .Select(a => new TaskActivityLogDto(
                a.Id,
                a.TaskId,
                a.Action.ToString(),
                a.OldValue,
                a.NewValue,
                a.ActorUserId,
                a.Actor != null ? a.Actor.FullName : "System",
                a.CreatedAtUtc
            ))
            .ToListAsync(ct);

        return new AdminDashboardDto(
            totalProjects,
            totalActiveProjects,
            totalUsers,
            totalDevelopers,
            totalTasks,
            overdueCount,
            breakdown,
            recentActivities
        );
    }

    public async Task<DeveloperDashboardDto> GetDeveloperDashboardAsync(int userId, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var inSevenDays = now.AddDays(7);

        var totalAssigned = await _db.Tasks.CountAsync(t => t.AssigneeUserId == userId, ct);

        var statusCounts = await _db.Tasks
            .Where(t => t.AssigneeUserId == userId)
            .GroupBy(t => t.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count, ct);

        var breakdown = new TaskStatusBreakdownDto(
            statusCounts.GetValueOrDefault(TaskItemStatus.ToDo, 0),
            statusCounts.GetValueOrDefault(TaskItemStatus.InProgress, 0),
            statusCounts.GetValueOrDefault(TaskItemStatus.InReview, 0),
            statusCounts.GetValueOrDefault(TaskItemStatus.Done, 0)
        );

        var overdueTasks = await _db.Tasks
            .AsNoTracking()
            .Where(t => t.AssigneeUserId == userId && t.DueDateUtc != null && t.DueDateUtc < now && t.Status != TaskItemStatus.Done)
            .OrderBy(t => t.DueDateUtc)
            .Take(5)
            .Select(t => new UrgentTaskSummaryDto(
                t.Id,
                t.ProjectId,
                t.Project.Key,
                t.Title,
                t.Priority.ToString(),
                t.Status.ToString(),
                t.DueDateUtc
            ))
            .ToListAsync(ct);

        var dueSoonTasks = await _db.Tasks
            .AsNoTracking()
            .Where(t => t.AssigneeUserId == userId && t.DueDateUtc != null && t.DueDateUtc >= now && t.DueDateUtc <= inSevenDays && t.Status != TaskItemStatus.Done)
            .OrderBy(t => t.DueDateUtc)
            .Take(5)
            .Select(t => new UrgentTaskSummaryDto(
                t.Id,
                t.ProjectId,
                t.Project.Key,
                t.Title,
                t.Priority.ToString(),
                t.Status.ToString(),
                t.DueDateUtc
            ))
            .ToListAsync(ct);

        var myProjects = await _db.Projects
            .AsNoTracking()
            .Where(p => p.OwnerUserId == userId || p.Members.Any(m => m.UserId == userId))
            .OrderByDescending(p => p.UpdatedAtUtc)
            .Take(6)
            .Select(p => new ProjectSummaryDto(
                p.Id,
                p.Key,
                p.Name,
                p.Description,
                p.GitHubRepoUrl,
                p.Status.ToString(),
                p.OwnerUserId,
                p.Owner.FullName,
                p.Members.Count,
                p.Tasks.Count,
                p.CreatedAtUtc,
                p.UpdatedAtUtc
            ))
            .ToListAsync(ct);

        return new DeveloperDashboardDto(
            totalAssigned,
            breakdown,
            overdueTasks,
            dueSoonTasks,
            myProjects
        );
    }
}
