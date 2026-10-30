using System;
using DevTaskHub.Api.Data;
using DevTaskHub.Api.Domain;
using DevTaskHub.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace DevTaskHub.Api.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _db;
    public UserService(AppDbContext db) => _db = db;

    public async Task<List<UserSummaryDto>> GetAllAsync(CancellationToken ct = default) => 
        await _db.Users
            .AsNoTracking()
            .Include(u => u.GitHubAccount)
            .OrderBy(u => u.Id)
            .Select(u => new UserSummaryDto(
                u.Id,
                u.Email,
                u.FullName,
                u.Role.ToString(),
                u.IsActive,
                u.GitHubAccount != null ? u.GitHubAccount.AvatarUrl : null,
                u.GitHubAccount != null ? u.GitHubAccount.GitHubUsername : null
            ))
            .ToListAsync(ct);

    public async Task<UserSummaryDto?> ToggleActiveAsync(int id, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.GitHubAccount)
            .FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user == null) return null;

        // An Admin can never be deactivated
        if (user.Role == UserRole.Admin && user.IsActive)
        {
            throw new ArgumentException("Administrator accounts cannot be deactivated.");
        }

        user.IsActive = !user.IsActive;
        await _db.SaveChangesAsync(ct);
        return new UserSummaryDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Role.ToString(),
            user.IsActive,
            user.GitHubAccount?.AvatarUrl,
            user.GitHubAccount?.GitHubUsername
        );
    }

    public async Task DeleteAsync(int id, int currentUserId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new KeyNotFoundException("User not found.");

        if (user.Role == UserRole.Admin)
        {
            throw new ArgumentException("Administrator accounts cannot be deleted.");
        }

        if (user.Id == currentUserId)
        {
            throw new ArgumentException("You cannot delete your own account.");
        }

        // Check if user is owner of any project
        var ownsProjects = await _db.Projects.AnyAsync(p => p.OwnerUserId == id, ct);
        if (ownsProjects)
        {
            throw new ArgumentException("Cannot delete this user because they own one or more projects. Please reassign project ownership first.");
        }

        // 1. Unassign all tasks assigned to this user
        var assignedTasks = await _db.Tasks.Where(t => t.AssigneeUserId == id).ToListAsync(ct);
        foreach (var task in assignedTasks)
        {
            task.AssigneeUserId = null;
            task.UpdatedAtUtc = DateTime.UtcNow;

            _db.TaskActivityLogs.Add(new TaskActivityLog
            {
                TaskId = task.Id,
                ProjectId = task.ProjectId,
                ActorUserId = currentUserId,
                Action = TaskActivityAction.Unassigned,
                OldValue = user.FullName,
                NewValue = null,
                Note = "Assignee deleted from system",
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        // 2. Remove user from all project memberships
        var memberships = await _db.ProjectMembers.Where(pm => pm.UserId == id).ToListAsync(ct);
        _db.ProjectMembers.RemoveRange(memberships);

        // 3. Remove linked GitHub account if any
        var gh = await _db.GitHubAccounts.FirstOrDefaultAsync(g => g.UserId == id, ct);
        if (gh != null)
        {
            _db.GitHubAccounts.Remove(gh);
        }

        // 4. Remove refresh tokens
        var tokens = await _db.RefreshTokens.Where(rt => rt.UserId == id).ToListAsync(ct);
        _db.RefreshTokens.RemoveRange(tokens);

        // 5. Delete the user
        _db.Users.Remove(user);
        await _db.SaveChangesAsync(ct);
    }
}
