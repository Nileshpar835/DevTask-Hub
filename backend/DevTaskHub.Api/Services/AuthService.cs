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

    public AuthService(AppDbContext db, IPasswordHasher<User> hasher)
    {
        _db = db;
        _hasher = hasher;
    }

    public async Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await _db.Users.AnyAsync(u => u.Email == email, ct))
            return AuthResult.Fail("Email is Already Registered");

        var user = new User
        {
            Email = email,
            FullName = request.FullName.Trim(),
            Role = UserRole.Developer,
            IsActive = true
        };
        user.PasswordHash = _hasher.HashPassword(user, request.password);

        _db.Users.Add(user);
        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            return AuthResult.Fail("Email is already Registered.");
        }
        return AuthResult.Ok(user);
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null)
            return AuthResult.Fail("Invalid Email or Password");

        var check = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.password);
        if (check == PasswordVerificationResult.Failed)
            return AuthResult.Fail("Invalid email or Password");

        if (!user.IsActive)
            return AuthResult.Fail("Account is Deactivated contact An Administrator.");

        return AuthResult.Ok(user);
    }


}
