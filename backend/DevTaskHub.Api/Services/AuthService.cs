using DevTaskHub.Api.Data;
using DevTaskHub.Api.Domain;
using DevTaskHub.Api.Dtos;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace DevTaskHub.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher<User> _hasher;
    private readonly ITokenService _tokens;

    public AuthService(AppDbContext db, IPasswordHasher<User> hasher, ITokenService tokens)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
    }

    public async Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await _db.Users.AnyAsync(u => u.Email == email, ct))
            return AuthResult.Fail("Email is already registered.");

        var user = new User
        {
            Email = email,
            FullName = request.FullName.Trim(),
            Role = UserRole.Developer,
            IsActive = true
        };
        user.PasswordHash = _hasher.HashPassword(user, request.Password);

        _db.Users.Add(user);
        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            return AuthResult.Fail("Email is already registered.");
        }

        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users
            .Include(u => u.GitHubAccount)
            .FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null)
            return AuthResult.Fail("Invalid email or password.");

        var check = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (check == PasswordVerificationResult.Failed)
            return AuthResult.Fail("Invalid email or password.");

        if (!user.IsActive)
            return AuthResult.Fail("Account is deactivated. Contact an administrator.");

        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResult> RefreshAsync(string? rawRefreshToken, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken))
            return AuthResult.Fail("Missing refresh token.");

        var hash = _tokens.HashRefreshToken(rawRefreshToken);
        var stored = await _db.RefreshTokens
            .Include(t => t.User)
                .ThenInclude(u => u.GitHubAccount)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (stored is null)
            return AuthResult.Fail("Invalid refresh token.");

        if (stored.RevokedAtUtc is not null)
        {
            // REUSE DETECTION: a revoked token came back — assume theft,
            // kill every outstanding session for this user.
            var family = await _db.RefreshTokens
                .Where(t => t.UserId == stored.UserId && t.RevokedAtUtc == null)
                .ToListAsync(ct);
            foreach (var t in family)
                t.RevokedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return AuthResult.Fail("Refresh token reuse detected. All sessions have been revoked.");
        }

        if (stored.ExpiresAtUtc <= DateTime.UtcNow)
            return AuthResult.Fail("Refresh token expired.");

        if (!stored.User.IsActive)
            return AuthResult.Fail("Account is deactivated. Contact an administrator.");

        // ROTATION: retire the presented token, insert its successor.
        var newRaw = _tokens.CreateRefreshToken();
        var newStored = new RefreshToken
        {
            UserId = stored.UserId,
            TokenHash = _tokens.HashRefreshToken(newRaw),
            ExpiresAtUtc = DateTime.UtcNow.AddDays(14)
        };
        _db.RefreshTokens.Add(newStored);
        await _db.SaveChangesAsync(ct);

        stored.RevokedAtUtc = DateTime.UtcNow;
        stored.ReplacedByTokenId = newStored.Id;
        await _db.SaveChangesAsync(ct);

        var (access, expires) = _tokens.CreateAccessToken(stored.User);
        return AuthResult.Ok(stored.User, access, expires, newRaw);
    }

    public async Task LogoutAsync(string? rawRefreshToken, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken))
            return;

        var hash = _tokens.HashRefreshToken(rawRefreshToken);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (stored is not null && stored.RevokedAtUtc is null)
        {
            stored.RevokedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
    }

    public Task<User?> FindUserByIdAsync(int id, CancellationToken ct) =>
        _db.Users.Include(u => u.GitHubAccount).FirstOrDefaultAsync(u => u.Id == id, ct);

    private async Task<AuthResult> IssueTokensAsync(User user, CancellationToken ct)
    {
        var rawRefresh = _tokens.CreateRefreshToken();
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = _tokens.HashRefreshToken(rawRefresh),
            ExpiresAtUtc = DateTime.UtcNow.AddDays(14)
        });
        await _db.SaveChangesAsync(ct);

        var (access, expires) = _tokens.CreateAccessToken(user);
        return AuthResult.Ok(user, access, expires, rawRefresh);
    }
}
