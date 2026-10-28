using System.Security.Claims;
using DevTaskHub.Api.Dtos;
using DevTaskHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DevTaskHub.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/github")]
public class GitHubController : ControllerBase
{
    private readonly IGitHubService _github;

    public GitHubController(IGitHubService github)
    {
        _github = github;
    }

    [HttpGet("profile")]
    public async Task<ActionResult<GitHubProfileDto>> GetProfile(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var profile = await _github.GetProfileAsync(userId, ct);
        if (profile == null) return NotFound(new { error = "No GitHub profile linked to this account." });
        return Ok(profile);
    }

    [HttpPost("profile")]
    public async Task<ActionResult<GitHubProfileDto>> LinkProfile(
        [FromBody] LinkGitHubProfileRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var profile = await _github.LinkProfileAsync(userId, request.Username, ct);
        return Ok(profile);
    }

    [HttpDelete("profile")]
    public async Task<IActionResult> UnlinkProfile(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        await _github.UnlinkProfileAsync(userId, ct);
        return NoContent();
    }

    private int GetCurrentUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user identity.");
        }
        return userId;
    }
}