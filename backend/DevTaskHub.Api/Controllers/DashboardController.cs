using System.Security.Claims;
using DevTaskHub.Api.Dtos;
using DevTaskHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DevTaskHub.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboard;

    public DashboardController(IDashboardService dashboard)
    {
        _dashboard = dashboard;
    }

    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AdminDashboardDto>> GetAdminDashboard(CancellationToken ct)
    {
        var stats = await _dashboard.GetAdminDashboardAsync(ct);
        return Ok(stats);
    }

    [HttpGet("developer")]
    public async Task<ActionResult<DeveloperDashboardDto>> GetDeveloperDashboard(CancellationToken ct)
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user identity.");
        }

        var stats = await _dashboard.GetDeveloperDashboardAsync(userId, ct);
        return Ok(stats);
    }
}