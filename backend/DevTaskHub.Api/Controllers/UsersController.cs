using Microsoft.AspNetCore.Http;
using DevTaskHub.Api.Dtos;
using DevTaskHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DevTaskHub.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _users;
    public UsersController(IUserService user) => _users = user;

    [HttpGet]
    public async Task<ActionResult<List<UserSummaryDto>>> GetAll(CancellationToken ct) => 
        Ok(await _users.GetAllAsync(ct));

    [HttpPatch("{id}/toggle-status")]
    public async Task<ActionResult<UserSummaryDto>> ToggleStatus(int id, CancellationToken ct)
    {
        var updated = await _users.ToggleActiveAsync(id, ct);
        if (updated == null) return NotFound(new { error = "User not found." });
        return Ok(updated);
    }
}
