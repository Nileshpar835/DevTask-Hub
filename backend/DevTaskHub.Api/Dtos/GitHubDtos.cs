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
    string? AuthorGitHubUsername,
    string? AuthorAvatarUrl,
    int? LinkedByUserId,
    string? LinkedByUserName,
    DateTime? LastSyncedAtUtc,
    string? SyncError
);

public record ProjectPullRequestDto(
    int Id,
    int TaskId,
    string TaskKey,
    string TaskTitle,
    string RepositoryOwner,
    string RepositoryName,
    int PullRequestNumber,
    string HtmlUrl,
    string? Title,
    string State,
    bool IsDraft,
    string? ReviewStatus,
    string? AuthorGitHubUsername,
    string? AuthorAvatarUrl,
    int? LinkedByUserId,
    string? LinkedByUserName,
    DateTime? LastSyncedAtUtc,
    string? SyncError,
    DateTime CreatedAtUtc
);
