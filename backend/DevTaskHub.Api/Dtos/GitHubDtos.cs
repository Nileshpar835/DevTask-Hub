using System.ComponentModel.DataAnnotations;

namespace DevTaskHub.Api.Dtos;

public record LinkGitHubProfileRequest(
    [Required, MaxLength(100)] string Username
);

public record GitHubProfileDto(
    int Id,
    int UserId,
    string Username,
    string? DisplayName,
    string? AvatarUrl,
    string? ProfileUrl,
    DateTime? FetchedAtUtc
);

public record LinkPullRequestRequest(
    [Required, Url] string Url
);

public record PullRequestDto(
    int Id,
    int TaskId,
    string RepositoryOwner,
    string RepositoryName,
    int PullRequestNumber,
    string HtmlUrl,
    string? Title,
    string State,
    bool IsDraft,
    string? ReviewStatus,
    DateTime? LastSyncedAtUtc,
    string? SyncError
);