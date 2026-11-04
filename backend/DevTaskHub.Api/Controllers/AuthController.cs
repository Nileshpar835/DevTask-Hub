using System.Security.Claims;
using DevTaskHub.Api.Domain;
using DevTaskHub.Api.Dtos;
using DevTaskHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DevTaskHub.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private static AuthResponse BuildAuthResponse(AuthResult result) =>
            new(result.AccessToken!, result.AccessTokenExpiresAtUtc!.Value,
                new AuthUserDto(
                    result.User!.Id,
                    result.User.Email,
                    result.User.FullName,
                    result.User.Role != null ? result.User.Role.Role : Role.Developer,
                    result.User.GitHubAccount?.AvatarUrl,
                    result.User.GitHubAccount?.GitHubUsername
                ));

    private const string RefreshCookieName = "devtaskhub_rt";
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth)
    {
        _auth = auth;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken ct)
    {
        var result = await _auth.RegisterAsync(request, ct);
        if (!result.Success)
            return BadRequest(new { error = result.Error });

        SetRefreshCookie(result.RefreshTokenRaw!);
        return CreatedAtAction(nameof(Register), BuildAuthResponse(result));
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct)
    {
        var result = await _auth.LoginAsync(request, ct);
        if (!result.Success)
            return Unauthorized(new { error = result.Error });

        SetRefreshCookie(result.RefreshTokenRaw!);
        return Ok(BuildAuthResponse(result));
    }

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(CancellationToken ct)
    {
        var raw = Request.Cookies[RefreshCookieName];
        var result = await _auth.RefreshAsync(raw, ct);
        if (!result.Success)
        {
            ClearRefreshCookie();
            return Unauthorized(new { error = result.Error });
        }

        SetRefreshCookie(result.RefreshTokenRaw!);
        return Ok(BuildAuthResponse(result));
    }

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var raw = Request.Cookies[RefreshCookieName];
        await _auth.LogoutAsync(raw, ct);
        ClearRefreshCookie();
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(AuthUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var userId))
            return Unauthorized();

        var user = await _auth.FindUserByIdAsync(userId, ct);
        if (user is null || !user.IsActive)
            return Unauthorized();

        return Ok(new AuthUserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Role != null ? user.Role.Role : Role.Developer,
            user.GitHubAccount?.AvatarUrl,
            user.GitHubAccount?.GitHubUsername
        ));
    }

    private void SetRefreshCookie(string rawToken)
    {
        var isHttps = Request.IsHttps;
        Response.Cookies.Append(RefreshCookieName, rawToken, new CookieOptions
        {
            HttpOnly = true,
            SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Secure = isHttps,
            Path = "/api/auth",
            Expires = DateTimeOffset.UtcNow.AddDays(14)
        });
    }

    private void ClearRefreshCookie()
    {
        var isHttps = Request.IsHttps;
        Response.Cookies.Delete(RefreshCookieName, new CookieOptions
        {
            HttpOnly = true,
            SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Secure = isHttps,
            Path = "/api/auth"
        });
    }
}
