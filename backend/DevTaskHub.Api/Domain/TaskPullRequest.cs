using System;

namespace DevTaskHub.Api.Domain;

public class TaskPullRequest
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public string RepositoryOwner { get; set; } = string.Empty;
    public string RepositoryName { get; set; } = string.Empty;
    public int PullRequestNumber { get; set; }
    public string HtmlUrl { get; set; } = string.Empty;
    public string? Title { get; set; }
    public GitHubPullRequestState GitHubState { get; set; }
    public bool IsDraft { get; set; }
    public GitHubReviewStatus? ReviewStatus { get; set; }
    public string? AuthorGitHubUsername { get; set; }
    public string? AuthorAvatarUrl { get; set; }
    public int? LinkedByUserId { get; set; }
    public DateTime? LastSyncedAtUtc { get; set; }
    public string? SyncError { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public TaskItem Task { get; set; } = null!;
    public User? LinkedByUser { get; set; }
}
