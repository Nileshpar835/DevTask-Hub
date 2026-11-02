using System;
using DevTaskHub.Api.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace DevTaskHub.Api.Data;

public class DbSeeder
{
    public static async Task SeedAdminAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<AppDbContext>();
        var hasher = services.GetRequiredService<IPasswordHasher<User>>();
        var config = services.GetRequiredService<IConfiguration>();

        if (!await db.Roles.AnyAsync())
        {
            db.Roles.AddRange(
                new Role { Id = Role.AdminId, Name = Role.Admin, Description = "Administrator with full system access", CreatedAtUtc = DateTime.UtcNow },
                new Role { Id = Role.DeveloperId, Name = Role.Developer, Description = "Software Developer with project and task access", CreatedAtUtc = DateTime.UtcNow }
            );
            await db.SaveChangesAsync();
        }

        if (await db.Users.AnyAsync(u => u.RoleId == Role.AdminId))
            return;

        var email = (config["Seed:Admin:Email"] ?? "admin@devtaskhub.local").Trim().ToLowerInvariant();
        var password = config["Seed:Admin:Password"]
            ?? throw new InvalidOperationException("Seed:Admin:Password is not configured (user-secrets).");
        var fullName = config["Seed:Admin:FullName"] ?? "Initial Admin";

        var admin = new User
        {
            Email = email,
            FullName = fullName,
            RoleId = Role.AdminId,
            IsActive = true
        };
        admin.PasswordHash = hasher.HashPassword(admin, password);

        db.Users.Add(admin);
        await db.SaveChangesAsync();
    }
}
