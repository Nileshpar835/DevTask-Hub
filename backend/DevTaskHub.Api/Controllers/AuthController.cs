using Microsoft.AspNetCore.Http;
using DevTaskHub.Api.Dtos;
using DevTaskHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DevTaskHub.Api.Controllers{

    [ApiController]
[Route("api/auth")]

public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthUserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken ct)
    {
        var result = await _auth.RegisterAsync(request, ct);
        if (!result.Success)
            return BadRequest(new { error = result.Error });

        var user = result.User!;
        var dto = new AuthUserDto(user.Id, user.Email, user.FullName, user.Role.ToString());
        return CreatedAtAction(nameof(Register), dto);
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct)
    {
        var result = await _auth.LoginAsync(request, ct);
        if (!result.Success)
            return Unauthorized(new { error = result.Error });

        var user = result.User!;
        var dto = new AuthUserDto(user.Id, user.Email, user.FullName, user.Role.ToString());
        return Ok(dto);

    }
}
}