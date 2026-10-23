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
    .OrderBy(u =>u.Id)
    .Select(u => new UserSummaryDto(u.Id,u.Email,u.FullName,u.Role.ToString(),u.IsActive))
    .ToListAsync(ct);
}
