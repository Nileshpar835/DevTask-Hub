using DevTaskHub.Api.Domain;
using DevTaskHub.Api.Dtos;

namespace DevTaskHub.Api.Services;

public record AuthResult(
    bool Success,
    string? Error,
    User? User,
    string? AccessToken = null,
    DateTime? AccessTokenExpiresAtUtc=null,
    string? RefreshTokenRaw = null
    )

{
    public static AuthResult Ok(
        User user,
        string access ,
        DateTime expires ,
        string refreshRaw
        
        ) => new(true, null, user ,access,expires,refreshRaw);

    public static AuthResult Fail(string error) => new(false, error, null);
}

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken ct);
    Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken ct);
    Task<AuthResult> RefreshAsync(string? rawRefreshToken,CancellationToken ct);
    Task LogoutAsync(string? rawRefreshToken, CancellationToken ct);
    Task<User?>FindUserByIdAsync(int id,CancellationToken ct);

}