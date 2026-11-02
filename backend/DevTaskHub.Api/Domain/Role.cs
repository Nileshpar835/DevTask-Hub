using System;
using System.Collections.Generic;

namespace DevTaskHub.Api.Domain;

public class Role
{
    public const int AdminId = 1;
    public const int DeveloperId = 2;
    public const string Admin = "Admin";
    public const string Developer = "Developer";

    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<User> Users { get; set; } = new List<User>();
}
