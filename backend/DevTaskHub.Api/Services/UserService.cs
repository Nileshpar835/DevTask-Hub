using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
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
            .Include(u => u.Role)
            .Include(u => u.GitHubAccount)
            .OrderBy(u => u.Id)
            .Select(u => new UserSummaryDto(
                u.Id,
                u.Email,
                u.FullName,
                u.Role != null ? u.Role.Role : Role.Developer,
                u.IsActive,
                u.GitHubAccount != null ? u.GitHubAccount.AvatarUrl : null,
                u.GitHubAccount != null ? u.GitHubAccount.GitHubUsername : null,
                u.Role != null ? u.Role.RoleId : Role.DeveloperId
            ))
            .ToListAsync(ct);

    public async Task<UserSummaryDto?> ToggleActiveAsync(int id, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .Include(u => u.GitHubAccount)
            .FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user == null) return null;

        // An Admin can never be deactivated
        if (user.Role?.RoleId == Role.AdminId && user.IsActive)
        {
            throw new ArgumentException("Administrator accounts cannot be deactivated.");
        }

        user.IsActive = !user.IsActive;
        user.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return new UserSummaryDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Role != null ? user.Role.Role : Role.Developer,
            user.IsActive,
            user.GitHubAccount?.AvatarUrl,
            user.GitHubAccount?.GitHubUsername,
            user.Role?.RoleId ?? Role.DeveloperId
        );
    }

    public async Task<UserSummaryDto> ChangeRoleAsync(int id, int newRoleId, int currentUserId, CancellationToken ct = default)
    {
        if (newRoleId != Role.AdminId && newRoleId != Role.DeveloperId)
            throw new KeyNotFoundException($"Role #{newRoleId} does not exist.");

        var user = await _db.Users
            .Include(u => u.Role)
            .Include(u => u.GitHubAccount)
            .FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new KeyNotFoundException($"User #{id} was not found.");

        var currentRoleId = user.Role?.RoleId ?? Role.DeveloperId;

        if (currentRoleId == Role.AdminId && newRoleId != Role.AdminId)
        {
            var otherActiveAdminCount = await _db.Roles.CountAsync(r => r.UserId != id && r.RoleId == Role.AdminId && r.User.IsActive, ct);
            if (otherActiveAdminCount == 0)
            {
                throw new InvalidOperationException("Cannot demote the last remaining active Administrator.");
            }
        }

        var newRoleName = newRoleId == Role.AdminId ? Role.Admin : Role.Developer;

        if (user.Role == null)
        {
            user.Role = new UserRole
            {
                UserId = user.Id,
                RoleId = newRoleId,
                Role = newRoleName
            };
            _db.Roles.Add(user.Role);
        }
        else
        {
            user.Role.RoleId = newRoleId;
            user.Role.Role = newRoleName;
        }

        user.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new UserSummaryDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Role.Role,
            user.IsActive,
            user.GitHubAccount?.AvatarUrl,
            user.GitHubAccount?.GitHubUsername,
            user.Role.RoleId
        );
    }

    public Task<IReadOnlyList<RoleDto>> GetRolesAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<RoleDto>>(new List<RoleDto>
        {
            new(Role.AdminId, Role.Admin, "Administrator with full system access"),
            new(Role.DeveloperId, Role.Developer, "Software Developer with project and task access")
        });

    public async Task DeleteAsync(int id, int currentUserId, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new KeyNotFoundException("User not found.");

        if (user.Role?.RoleId == Role.AdminId)
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

        // 5. Delete the user (UserRole in Roles will be deleted via cascade)
        _db.Users.Remove(user);
        await _db.SaveChangesAsync(ct);
    }
}
