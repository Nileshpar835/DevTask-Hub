using System;
namespace DevTaskHub.Api.Domain;

public class GitHubAccount
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string GitHubUsername { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? ProfileUrl { get; set; }
    public string? PublicProfileJson { get; set; }
    public DateTime? FetchedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}