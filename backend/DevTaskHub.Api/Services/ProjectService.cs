using DevTaskHub.Api.Data;
using DevTaskHub.Api.Domain;
using DevTaskHub.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace DevTaskHub.Api.Services;

public class ProjectService : IProjectService
{
    private readonly AppDbContext _db;

    public ProjectService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<ProjectSummaryDto>> GetProjectsAsync(
        int currentUserId, bool isAdmin, ProjectQueryParameters query, CancellationToken ct)
    {
        var q = _db.Projects.AsNoTracking();

        // 1. Role-based scoping: non-admins only see projects where they are owner or member
        if (!isAdmin)
        {
            q = q.Where(p => p.OwnerUserId == currentUserId || p.Members.Any(m => m.UserId == currentUserId));
        }

        // 2. Filters
        if (query.Mine == true)
        {
            q = q.Where(p => p.OwnerUserId == currentUserId);
        }

        if (query.Status.HasValue)
        {
            q = q.Where(p => p.Status == query.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            q = q.Where(p => p.Key.ToLower().Contains(term) || p.Name.ToLower().Contains(term));
        }

        var totalCount = await q.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalCount / (double)query.PageSize);

        var items = await q
            .OrderByDescending(p => p.UpdatedAtUtc)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(p => new ProjectSummaryDto(
                p.Id,
                p.Key,
                p.Name,
                p.Description,
                p.Status.ToString(),
                p.OwnerUserId,
                p.Owner.FullName,
                p.Members.Count,
                p.Tasks.Count,
                p.CreatedAtUtc,
                p.UpdatedAtUtc
            ))
            .ToListAsync(ct);

        return new PagedResult<ProjectSummaryDto>(
            items,
            query.Page,
            query.PageSize,
            totalCount,
            totalPages,
            query.Page < totalPages,
            query.Page > 1
        );
    }

    public async Task<ProjectDetailDto> GetProjectByIdAsync(int id, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        var project = await _db.Projects
            .AsNoTracking()
            .Include(p => p.Owner)
            .Include(p => p.Members)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new KeyNotFoundException($"Project #{id} was not found.");

        if (!isAdmin && project.OwnerUserId != currentUserId && !project.Members.Any(m => m.UserId == currentUserId))
        {
            throw new UnauthorizedAccessException("You do not have access to this project.");
        }

        var members = project.Members.Select(m => new ProjectMemberDto(
            m.Id,
            m.UserId,
            m.User.Email,
            m.User.FullName,
            m.User.Role.ToString(),
            m.AddedAtUtc
        )).ToList();

        return new ProjectDetailDto(
            project.Id,
            project.Key,
            project.Name,
            project.Description,
            project.Status.ToString(),
            project.OwnerUserId,
            project.Owner.FullName,
            project.CreatedAtUtc,
            project.UpdatedAtUtc,
            members
        );
    }

    public async Task<ProjectSummaryDto> CreateProjectAsync(CreateProjectRequest request, int currentUserId, CancellationToken ct)
    {
        var upperKey = request.Key.Trim().ToUpperInvariant();

        if (await _db.Projects.AnyAsync(p => p.Key == upperKey, ct))
        {
            throw new ArgumentException($"A project with Key '{upperKey}' already exists.");
        }

        var user = await _db.Users.FindAsync([currentUserId], ct)
            ?? throw new KeyNotFoundException("Creator user not found.");

        var project = new Project
        {
            Key = upperKey,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Status = ProjectStatus.Active,
            OwnerUserId = currentUserId,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        // Creator is also added as first member
        project.Members.Add(new ProjectMember
        {
            UserId = currentUserId,
            AddedAtUtc = DateTime.UtcNow
        });

        _db.Projects.Add(project);
        await _db.SaveChangesAsync(ct);

        return new ProjectSummaryDto(
            project.Id,
            project.Key,
            project.Name,
            project.Description,
            project.Status.ToString(),
            project.OwnerUserId,
            user.FullName,
            1,
            0,
            project.CreatedAtUtc,
            project.UpdatedAtUtc
        );
    }

    public async Task<ProjectSummaryDto> UpdateProjectAsync(
        int id, UpdateProjectRequest request, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        var project = await _db.Projects
            .Include(p => p.Owner)
            .Include(p => p.Members)
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new KeyNotFoundException($"Project #{id} was not found.");

        if (!isAdmin && project.OwnerUserId != currentUserId)
        {
            throw new UnauthorizedAccessException("Only the project owner or an administrator can update this project.");
        }

        project.Name = request.Name.Trim();
        project.Description = request.Description?.Trim();
        project.Status = request.Status;
        project.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return new ProjectSummaryDto(
            project.Id,
            project.Key,
            project.Name,
            project.Description,
            project.Status.ToString(),
            project.OwnerUserId,
            project.Owner.FullName,
            project.Members.Count,
            project.Tasks.Count,
            project.CreatedAtUtc,
            project.UpdatedAtUtc
        );
    }

    public async Task DeleteProjectAsync(int id, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        var project = await _db.Projects
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new KeyNotFoundException($"Project #{id} was not found.");

        if (!isAdmin && project.OwnerUserId != currentUserId)
        {
            throw new UnauthorizedAccessException("Only an administrator or project owner can delete this project.");
        }

        if (project.Tasks.Any(t => t.Status != TaskItemStatus.Done))
        {
            throw new ArgumentException("Cannot delete project while it contains incomplete tasks.");
        }

        _db.Projects.Remove(project);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<ProjectMemberDto>> GetMembersAsync(int projectId, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        var project = await _db.Projects
            .AsNoTracking()
            .Include(p => p.Members)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(p => p.Id == projectId, ct)
            ?? throw new KeyNotFoundException($"Project #{projectId} was not found.");

        if (!isAdmin && project.OwnerUserId != currentUserId && !project.Members.Any(m => m.UserId == currentUserId))
        {
            throw new UnauthorizedAccessException("You do not have access to this project's members.");
        }

        return project.Members.Select(m => new ProjectMemberDto(
            m.Id,
            m.UserId,
            m.User.Email,
            m.User.FullName,
            m.User.Role.ToString(),
            m.AddedAtUtc
        )).ToList();
    }

    public async Task<ProjectMemberDto> AddMemberAsync(int projectId, int userIdToAdd, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        var project = await _db.Projects
            .Include(p => p.Members)
            .FirstOrDefaultAsync(p => p.Id == projectId, ct)
            ?? throw new KeyNotFoundException($"Project #{projectId} was not found.");

        if (!isAdmin && project.OwnerUserId != currentUserId)
        {
            throw new UnauthorizedAccessException("Only the project owner or an administrator can add members.");
        }

        if (project.Members.Any(m => m.UserId == userIdToAdd))
        {
            throw new ArgumentException("User is already a member of this project.");
        }

        var userToAdd = await _db.Users.FindAsync([userIdToAdd], ct)
            ?? throw new KeyNotFoundException($"User #{userIdToAdd} does not exist.");

        var newMember = new ProjectMember
        {
            ProjectId = projectId,
            UserId = userIdToAdd,
            AddedAtUtc = DateTime.UtcNow
        };

        _db.ProjectMembers.Add(newMember);
        await _db.SaveChangesAsync(ct);

        return new ProjectMemberDto(
            newMember.Id,
            userToAdd.Id,
            userToAdd.Email,
            userToAdd.FullName,
            userToAdd.Role.ToString(),
            newMember.AddedAtUtc
        );
    }

    public async Task RemoveMemberAsync(int projectId, int userIdToRemove, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        var project = await _db.Projects
            .Include(p => p.Members)
            .FirstOrDefaultAsync(p => p.Id == projectId, ct)
            ?? throw new KeyNotFoundException($"Project #{projectId} was not found.");

        if (!isAdmin && project.OwnerUserId != currentUserId)
        {
            throw new UnauthorizedAccessException("Only the project owner or an administrator can remove members.");
        }

        if (project.OwnerUserId == userIdToRemove)
        {
            throw new ArgumentException("Cannot remove the project owner from members.");
        }

        var member = project.Members.FirstOrDefault(m => m.UserId == userIdToRemove)
            ?? throw new KeyNotFoundException("User is not a member of this project.");

        _db.ProjectMembers.Remove(member);
        await _db.SaveChangesAsync(ct);
    }
}