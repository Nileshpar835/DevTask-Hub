using System.Security.Claims;
using DevTaskHub.Api.Domain;
using DevTaskHub.Api.Dtos;
using DevTaskHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DevTaskHub.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _tasks;
    private readonly IGitHubService _github;

    public TasksController(ITaskService tasks, IGitHubService github)
    {
        _tasks = tasks;
        _github = github;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<TaskSummaryDto>>> GetTasks(
        [FromQuery] TaskQueryParameters query, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var result = await _tasks.GetTasksAsync(userId, isAdmin, query, ct);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskDetailDto>> GetTaskById(int id, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var result = await _tasks.GetTaskByIdAsync(id, userId, isAdmin, ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TaskDetailDto>> CreateTask(CreateTaskRequest request, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var created = await _tasks.CreateTaskAsync(request, userId, isAdmin, ct);
        return CreatedAtAction(nameof(GetTaskById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TaskDetailDto>> UpdateTask(
        int id, UpdateTaskRequest request, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var updated = await _tasks.UpdateTaskAsync(id, request, userId, isAdmin, ct);
        return Ok(updated);
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<TaskDetailDto>> ChangeStatus(
        int id, ChangeTaskStatusRequest request, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var updated = await _tasks.ChangeStatusAsync(id, request, userId, isAdmin, ct);
        return Ok(updated);
    }

    [HttpPatch("{id:int}/assignee")]
    public async Task<ActionResult<TaskDetailDto>> AssignTask(
        int id, AssignTaskRequest request, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var updated = await _tasks.AssignTaskAsync(id, request, userId, isAdmin, ct);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteTask(int id, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        await _tasks.DeleteTaskAsync(id, userId, isAdmin, ct);
        return NoContent();
    }

    [HttpGet("{id:int}/activity")]
    public async Task<ActionResult<IReadOnlyList<TaskActivityLogDto>>> GetActivity(int id, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var logs = await _tasks.GetActivityLogsAsync(id, userId, isAdmin, ct);
        return Ok(logs);
    }

    private (int UserId, bool IsAdmin) GetCurrentUserInfo()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user identity.");
        }

        var isAdmin = User.IsInRole("Admin") ||
            User.FindFirstValue(ClaimTypes.Role) == UserRole.Admin.ToString();

        return (userId, isAdmin);
    }

    [HttpGet("{id:int}/pull-requests")]
    public async Task<ActionResult<IReadOnlyList<PullRequestDto>>> GetPullRequests(int id, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var prs = await _github.GetTaskPullRequestsAsync(id, userId, isAdmin, ct);
        return Ok(prs);
    }

    [HttpPost("{id:int}/pull-requests")]
    public async Task<ActionResult<PullRequestDto>> LinkPullRequest(
        int id, [FromBody] LinkPullRequestRequest request, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var pr = await _github.LinkPullRequestAsync(id, request.Url, userId, isAdmin, ct);
        return CreatedAtAction(nameof(GetPullRequests), new { id }, pr);
    }

    [HttpPost("{id:int}/pull-requests/{prId:int}/sync")]
    public async Task<ActionResult<PullRequestDto>> SyncPullRequest(int id, int prId, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var pr = await _github.SyncPullRequestAsync(id, prId, userId, isAdmin, ct);
        return Ok(pr);
    }

    [HttpDelete("{id:int}/pull-requests/{prId:int}")]
    public async Task<IActionResult> UnlinkPullRequest(int id, int prId, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        await _github.UnlinkPullRequestAsync(id, prId, userId, isAdmin, ct);
        return NoContent();
    }
}
