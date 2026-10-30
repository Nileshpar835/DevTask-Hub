using System.Security.Claims;
using DevTaskHub.Api.Domain;
using DevTaskHub.Api.Dtos;
using DevTaskHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DevTaskHub.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projects;
    private readonly IGitHubService _github;

    public ProjectsController(IProjectService projects, IGitHubService github)
    {
        _projects = projects;
        _github = github;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<ProjectSummaryDto>>> GetProjects(
        [FromQuery] ProjectQueryParameters query, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var result = await _projects.GetProjectsAsync(userId, isAdmin, query, ct);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProjectDetailDto>> GetProjectById(int id, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var result = await _projects.GetProjectByIdAsync(id, userId, isAdmin, ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ProjectSummaryDto>> CreateProject(CreateProjectRequest request, CancellationToken ct)
    {
        var (userId, _) = GetCurrentUserInfo();
        var created = await _projects.CreateProjectAsync(request, userId, ct);
        return CreatedAtAction(nameof(GetProjectById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProjectSummaryDto>> UpdateProject(
        int id, UpdateProjectRequest request, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var updated = await _projects.UpdateProjectAsync(id, request, userId, isAdmin, ct);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProject(int id, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        await _projects.DeleteProjectAsync(id, userId, isAdmin, ct);
        return NoContent();
    }

    [HttpGet("{id:int}/members")]
    public async Task<ActionResult<IReadOnlyList<ProjectMemberDto>>> GetMembers(int id, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var members = await _projects.GetMembersAsync(id, userId, isAdmin, ct);
        return Ok(members);
    }

    [HttpPost("{id:int}/members")]
    public async Task<ActionResult<ProjectMemberDto>> AddMember(
        int id, AddProjectMemberRequest request, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var member = await _projects.AddMemberAsync(id, request.UserId, userId, isAdmin, ct);
        return CreatedAtAction(nameof(GetMembers), new { id }, member);
    }

    [HttpDelete("{id:int}/members/{memberUserId:int}")]
    public async Task<IActionResult> RemoveMember(int id, int memberUserId, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        await _projects.RemoveMemberAsync(id, memberUserId, userId, isAdmin, ct);
        return NoContent();
    }

    [HttpGet("{id:int}/pull-requests")]
    public async Task<ActionResult<IReadOnlyList<ProjectPullRequestDto>>> GetPullRequests(int id, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var prs = await _github.GetProjectPullRequestsAsync(id, userId, isAdmin, ct);
        return Ok(prs);
    }

    [HttpPost("{id:int}/pull-requests/sync")]
    public async Task<ActionResult<IReadOnlyList<ProjectPullRequestDto>>> SyncPullRequests(int id, CancellationToken ct)
    {
        var (userId, isAdmin) = GetCurrentUserInfo();
        var prs = await _github.SyncProjectPullRequestsAsync(id, userId, isAdmin, ct);
        return Ok(prs);
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
}
