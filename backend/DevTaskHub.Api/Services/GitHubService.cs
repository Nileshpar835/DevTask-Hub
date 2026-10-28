using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using DevTaskHub.Api.Data;
using DevTaskHub.Api.Domain;
using DevTaskHub.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace DevTaskHub.Api.Services;

public partial class GitHubService : IGitHubService
{
    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<GitHubService> _logger;

    [GeneratedRegex(@"^https?://github\.com/([a-zA-Z0-9_.-]+)/([a-zA-Z0-9_.-]+)/pull/(\d+)/?$", RegexOptions.IgnoreCase)]
    private static partial Regex GitHubPrRegex();

    public GitHubService(AppDbContext db, IHttpClientFactory httpClientFactory, ILogger<GitHubService> logger)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<GitHubProfileDto?> GetProfileAsync(int userId, CancellationToken ct)
    {
        var account = await _db.GitHubAccounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.UserId == userId, ct);

        return account == null ? null : MapToProfileDto(account);
    }

    public async Task<GitHubProfileDto> LinkProfileAsync(int userId, string username, CancellationToken ct)
    {
        var cleanUsername = username.Trim().TrimStart('@');
        var client = _httpClientFactory.CreateClient("GitHub");

        var response = await client.GetAsync($"users/{cleanUsername}", ct);
        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            throw new ArgumentException($"GitHub user '{cleanUsername}' was not found.");
        }
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var displayName = root.TryGetProperty("name", out var nameProp) && nameProp.ValueKind == JsonValueKind.String ? nameProp.GetString() : cleanUsername;
        var avatarUrl = root.TryGetProperty("avatar_url", out var avProp) ? avProp.GetString() : null;
        var profileUrl = root.TryGetProperty("html_url", out var htmlProp) ? htmlProp.GetString() : $"https://github.com/{cleanUsername}";

        var account = await _db.GitHubAccounts.FirstOrDefaultAsync(a => a.UserId == userId, ct);
        if (account == null)
        {
            account = new GitHubAccount
            {
                UserId = userId,
                GitHubUsername = cleanUsername,
                DisplayName = displayName,
                AvatarUrl = avatarUrl,
                ProfileUrl = profileUrl,
                FetchedAtUtc = DateTime.UtcNow,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow
            };
            _db.GitHubAccounts.Add(account);
        }
        else
        {
            account.GitHubUsername = cleanUsername;
            account.DisplayName = displayName;
            account.AvatarUrl = avatarUrl;
            account.ProfileUrl = profileUrl;
            account.FetchedAtUtc = DateTime.UtcNow;
            account.UpdatedAtUtc = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
        return MapToProfileDto(account);
    }

    public async Task UnlinkProfileAsync(int userId, CancellationToken ct)
    {
        var account = await _db.GitHubAccounts.FirstOrDefaultAsync(a => a.UserId == userId, ct);
        if (account != null)
        {
            _db.GitHubAccounts.Remove(account);
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<IReadOnlyList<PullRequestDto>> GetTaskPullRequestsAsync(
        int taskId, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        await ValidateTaskAccessAsync(taskId, currentUserId, isAdmin, ct);

        return await _db.TaskPullRequests
            .AsNoTracking()
            .Where(pr => pr.TaskId == taskId)
            .OrderByDescending(pr => pr.CreatedAtUtc)
            .Select(pr => MapToPrDto(pr))
            .ToListAsync(ct);
    }

    public async Task<PullRequestDto> LinkPullRequestAsync(
        int taskId, string prUrl, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        var task = await ValidateTaskAccessAsync(taskId, currentUserId, isAdmin, ct);

        var match = GitHubPrRegex().Match(prUrl.Trim());
        if (!match.Success)
        {
            throw new ArgumentException("Invalid GitHub PR URL. Format must be: https://github.com/{owner}/{repo}/pull/{number}");
        }

        var owner = match.Groups[1].Value;
        var repo = match.Groups[2].Value;
        var prNumber = int.Parse(match.Groups[3].Value);

        if (await _db.TaskPullRequests.AnyAsync(pr => pr.TaskId == taskId && pr.RepositoryOwner == owner && pr.RepositoryName == repo && pr.PullRequestNumber == prNumber, ct))
        {
            throw new ArgumentException("This Pull Request is already linked to this task.");
        }

        var (title, state, isDraft, error) = await FetchPrFromGitHubAsync(owner, repo, prNumber, ct);

        var pr = new TaskPullRequest
        {
            TaskId = taskId,
            RepositoryOwner = owner,
            RepositoryName = repo,
            PullRequestNumber = prNumber,
            HtmlUrl = prUrl.Trim(),
            Title = title,
            GitHubState = state,
            IsDraft = isDraft,
            LastSyncedAtUtc = DateTime.UtcNow,
            SyncError = error,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.TaskPullRequests.Add(pr);

        // Add activity log
        _db.TaskActivityLogs.Add(new TaskActivityLog
        {
            TaskId = taskId,
            ProjectId = task.ProjectId,
            Action = TaskActivityAction.PullRequestLinked,
            NewValue = $"{owner}/{repo}#{prNumber}",
            ActorUserId = currentUserId,
            CreatedAtUtc = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(ct);
        return MapToPrDto(pr);
    }

    public async Task<PullRequestDto> SyncPullRequestAsync(
        int taskId, int prId, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        await ValidateTaskAccessAsync(taskId, currentUserId, isAdmin, ct);

        var pr = await _db.TaskPullRequests.FirstOrDefaultAsync(p => p.Id == prId && p.TaskId == taskId, ct)
            ?? throw new KeyNotFoundException($"Pull Request link #{prId} not found.");

        var (title, state, isDraft, error) = await FetchPrFromGitHubAsync(pr.RepositoryOwner, pr.RepositoryName, pr.PullRequestNumber, ct);

        pr.Title = title ?? pr.Title;
        pr.GitHubState = state;
        pr.IsDraft = isDraft;
        pr.LastSyncedAtUtc = DateTime.UtcNow;
        pr.SyncError = error;

        await _db.SaveChangesAsync(ct);
        return MapToPrDto(pr);
    }

    public async Task UnlinkPullRequestAsync(
        int taskId, int prId, int currentUserId, bool isAdmin, CancellationToken ct)
    {
        var task = await ValidateTaskAccessAsync(taskId, currentUserId, isAdmin, ct);

        var pr = await _db.TaskPullRequests.FirstOrDefaultAsync(p => p.Id == prId && p.TaskId == taskId, ct)
            ?? throw new KeyNotFoundException($"Pull Request link #{prId} not found.");

        _db.TaskPullRequests.Remove(pr);

        _db.TaskActivityLogs.Add(new TaskActivityLog
        {
            TaskId = taskId,
            ProjectId = task.ProjectId,
            Action = TaskActivityAction.PullRequestUnlinked,
            OldValue = $"{pr.RepositoryOwner}/{pr.RepositoryName}#{pr.PullRequestNumber}",
            ActorUserId = currentUserId,
            CreatedAtUtc = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(ct);
    }

    private async Task<(string? Title, GitHubPullRequestState State, bool IsDraft, string? Error)> FetchPrFromGitHubAsync(
        string owner, string repo, int number, CancellationToken ct)
    {
        var client = _httpClientFactory.CreateClient("GitHub");
        try
        {
            var response = await client.GetAsync($"repos/{owner}/{repo}/pulls/{number}", ct);
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return (null, GitHubPullRequestState.Open, false, "PR not found on GitHub.");
            }
            if (response.StatusCode == HttpStatusCode.Forbidden || response.StatusCode == (HttpStatusCode)429)
            {
                return (null, GitHubPullRequestState.Open, false, "GitHub API rate limit exceeded. Try again later.");
            }
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var title = root.TryGetProperty("title", out var titleProp) ? titleProp.GetString() : null;
            var isDraft = root.TryGetProperty("draft", out var draftProp) && draftProp.GetBoolean();
            var merged = root.TryGetProperty("merged_at", out var mergedProp) && mergedProp.ValueKind != JsonValueKind.Null;
            var stateStr = root.TryGetProperty("state", out var stateProp) ? stateProp.GetString() : "open";

            var state = merged ? GitHubPullRequestState.Merged
                      : stateStr == "closed" ? GitHubPullRequestState.Closed
                      : GitHubPullRequestState.Open;

            return (title, state, isDraft, null);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to sync GitHub PR {Owner}/{Repo}#{Number}", owner, repo, number);
            return (null, GitHubPullRequestState.Open, false, "Network error communicating with GitHub.");
        }
    }

    private async Task<TaskItem> ValidateTaskAccessAsync(int taskId, int userId, bool isAdmin, CancellationToken ct)
    {
        var task = await _db.Tasks
            .AsNoTracking()
            .Include(t => t.Project)
                .ThenInclude(p => p.Members)
            .FirstOrDefaultAsync(t => t.Id == taskId, ct)
            ?? throw new KeyNotFoundException($"Task #{taskId} not found.");

        if (!isAdmin && task.Project.OwnerUserId != userId && !task.Project.Members.Any(m => m.UserId == userId))
        {
            throw new UnauthorizedAccessException("You do not have access to this task.");
        }

        return task;
    }

    private static GitHubProfileDto MapToProfileDto(GitHubAccount a) =>
        new(a.Id, a.UserId, a.GitHubUsername, a.DisplayName, a.AvatarUrl, a.ProfileUrl, a.FetchedAtUtc);

    private static PullRequestDto MapToPrDto(TaskPullRequest pr) =>
        new(
            pr.Id,
            pr.TaskId,
            pr.RepositoryOwner,
            pr.RepositoryName,
            pr.PullRequestNumber,
            pr.HtmlUrl,
            pr.Title,
            pr.GitHubState.ToString(),
            pr.IsDraft,
            pr.ReviewStatus?.ToString(),
            pr.LastSyncedAtUtc,
            pr.SyncError
        );
}
