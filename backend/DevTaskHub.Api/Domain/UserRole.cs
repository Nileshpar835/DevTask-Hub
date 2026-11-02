using System;

namespace DevTaskHub.Api.Domain;

public class UserRole
{
    public const int AdminRoleId = 1;
    public const int DeveloperRoleId = 2;
    public const string Admin = "Admin";
    public const string Developer = "Developer";

    public int Id { get; set; }
    public int UserId { get; set; }
    public int RoleId { get; set; } = DeveloperRoleId;
    public string Role { get; set; } = Developer;

    public User User { get; set; } = null!;
}
