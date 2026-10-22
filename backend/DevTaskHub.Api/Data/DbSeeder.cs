using System;
using DevTaskHub.Api.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;
namespace DevTaskHub.Api.Data;

public class DbSeeder
{
    public static async Task SeedAdminAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<AppDbContext>();
        var hasher = services.GetRequiredService<IPasswordHasher<User>>();
        var config = services.GetRequiredService<IConfiguration>();

        if (await db.Users.AnyAsync(u => u.Role == UserRole.Admin))
            return;

        var email = (config["Seed:Admin:Email"] ?? "admin@devtaskhub.local").Trim().ToLowerInvariant();
        var password = config["Seed:Admin:Password"]
            ?? throw new InvalidOperationException("Seed:Admin:Password is not configured (user-secrets).");
        var fullName = config["Seed:Admin:FullName"] ?? "Initial Admin";

        var admin = new User
        {
            Email = email,
            FullName = fullName,
            Role = UserRole.Admin,
            IsActive = true
        };
        admin.PasswordHash = hasher.HashPassword(admin, password);

        db.Users.Add(admin);
        await db.SaveChangesAsync();

    }

}
