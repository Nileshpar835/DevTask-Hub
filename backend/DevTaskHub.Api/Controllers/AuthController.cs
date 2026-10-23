using System.Security.Claims;
using DevTaskHub.Api.Dtos;
using DevTaskHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DevTaskHub.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const string RefreshCookieName = "refresh_token";
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
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

        return Ok(new AuthUserDto(user.Id, user.Email, user.FullName, user.Role.ToString()));
    }

    private static AuthResponse BuildAuthResponse(AuthResult result) =>
        new(result.AccessToken!, result.AccessTokenExpiresAtUtc!.Value,
            new AuthUserDto(result.User!.Id, result.User.Email, result.User.FullName, result.User.Role.ToString()));

    private void SetRefreshCookie(string rawToken) =>
        Response.Cookies.Append(RefreshCookieName, rawToken, new CookieOptions
        {
            HttpOnly = true,                 // JS cannot read it — XSS can't steal it
            SameSite = SameSiteMode.Lax,     // not sent on cross-site POSTs — CSRF guard
            Secure = Request.IsHttps,        // true in production, flexible for local HTTP
            Path = "/api/auth",              // cookie only travels to auth endpoints
            Expires = DateTimeOffset.UtcNow.AddDays(14)
        });

    private void ClearRefreshCookie() =>
        Response.Cookies.Delete(RefreshCookieName, new CookieOptions { Path = "/api/auth" });
}