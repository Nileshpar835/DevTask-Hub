using DevTaskHub.Api.Dtos;

namespace DevTaskHub.Api.Services;

public interface IDashboardService
{
    Task<AdminDashboardDto> GetAdminDashboardAsync(CancellationToken ct);
    Task<DeveloperDashboardDto> GetDeveloperDashboardAsync(int userId, CancellationToken ct);
}