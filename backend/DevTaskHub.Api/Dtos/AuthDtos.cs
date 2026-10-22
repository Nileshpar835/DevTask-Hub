using System.ComponentModel.DataAnnotations;

namespace DevTaskHub.Api.Dtos;

public record RegisterRequest(
    [property: Required, EmailAddress, MaxLength(256)] string Email,
    [property: Required, MinLength(8), MaxLength(100)] string Password,
    [property: Required, MaxLength(100)] string FullName);

public record LoginRequest(
    [property: Required, EmailAddress] string Email,
    [property: Required] string Password);

public record AuthUserDto(int Id, string Email, string FullName, string Role);

// What the client gets on login/register/refresh. Raw refresh token is NOT here —
// it travels only in the httpOnly cookie.
public record AuthResponse(string AccessToken, DateTime AccessTokenExpiresAtUtc, AuthUserDto User);