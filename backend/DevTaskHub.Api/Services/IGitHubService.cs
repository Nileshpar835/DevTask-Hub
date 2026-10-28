using DevTaskHub.Api.Dtos;

namespace DevTaskHub.Api.Services;

public interface IGitHubService
{
    Task<GitHubProfileDto?> GetProfileAsync(int userId, CancellationToken ct);
    Task<GitHubProfileDto> LinkProfileAsync(int userId, string username, CancellationToken ct);
    Task UnlinkProfileAsync(int userId, CancellationToken ct);

    Task<IReadOnlyList<PullRequestDto>> GetTaskPullRequestsAsync(int taskId, int currentUserId, bool isAdmin, CancellationToken ct);
    Task<PullRequestDto> LinkPullRequestAsync(int taskId, string prUrl, int currentUserId, bool isAdmin, CancellationToken ct);
    Task<PullRequestDto> SyncPullRequestAsync(int taskId, int prId, int currentUserId, bool isAdmin, CancellationToken ct);
    Task UnlinkPullRequestAsync(int taskId, int prId, int currentUserId, bool isAdmin, CancellationToken ct);
}