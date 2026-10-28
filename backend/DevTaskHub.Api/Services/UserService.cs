using System;
using DevTaskHub.Api.Data;
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
            .OrderBy(u => u.Id)
            .Select(u => new UserSummaryDto(u.Id, u.Email, u.FullName, u.Role.ToString(), u.IsActive))
            .ToListAsync(ct);

    public async Task<UserSummaryDto?> ToggleActiveAsync(int id, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user == null) return null;

        user.IsActive = !user.IsActive;
        await _db.SaveChangesAsync(ct);
        return new UserSummaryDto(user.Id, user.Email, user.FullName, user.Role.ToString(), user.IsActive);
    }
}
