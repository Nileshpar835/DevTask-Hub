using System.Security.Claims;
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

    [HttpPatch("{id:int}/toggle-status")]
    public async Task<ActionResult<UserSummaryDto>> ToggleStatus(int id, CancellationToken ct)
    {
        var updated = await _users.ToggleActiveAsync(id, ct);
        if (updated == null) return NotFound(new { error = "User not found." });
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var currentUserId))
        {
            throw new UnauthorizedAccessException("Invalid user identity.");
        }

        await _users.DeleteAsync(id, currentUserId, ct);
        return NoContent();
    }
}
