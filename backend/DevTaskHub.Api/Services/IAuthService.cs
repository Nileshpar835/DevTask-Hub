using DevTaskHub.Api.Domain;
using DevTaskHub.Api.Dtos;

namespace DevTaskHub.Api.Services;

public record AuthResult(bool Success, string? Error, User? User)
{
    public static AuthResult Ok(User user) => new(true, null, user);
    public static AuthResult Fail(string error) => new(false, error, null);
}

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken ct);
    Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken ct);
}