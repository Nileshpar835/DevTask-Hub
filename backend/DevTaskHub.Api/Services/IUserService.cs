using System;
using DevTaskHub.Api.Dtos;

namespace DevTaskHub.Api.Services;

public interface IUserService
{
    Task<List<UserSummaryDto>> GetAllAsync(CancellationToken ct = default);
    Task<UserSummaryDto?> ToggleActiveAsync(int id, CancellationToken ct = default);
    Task<UserSummaryDto> ChangeRoleAsync(int id, int newRoleId, int currentUserId, CancellationToken ct = default);
    Task<IReadOnlyList<RoleDto>> GetRolesAsync(CancellationToken ct = default);
    Task DeleteAsync(int id, int currentUserId, CancellationToken ct = default);
}
