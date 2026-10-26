using DevTaskHub.Api.Dtos;

namespace DevTaskHub.Api.Services;

public interface IProjectService
{
    Task<PagedResult<ProjectSummaryDto>> GetProjectsAsync(int currentUserId, bool isAdmin, ProjectQueryParameters query, CancellationToken ct);
    Task<ProjectDetailDto> GetProjectByIdAsync(int id, int currentUserId, bool isAdmin, CancellationToken ct);
    Task<ProjectSummaryDto> CreateProjectAsync(CreateProjectRequest request, int currentUserId, CancellationToken ct);
    Task<ProjectSummaryDto> UpdateProjectAsync(int id, UpdateProjectRequest request, int currentUserId, bool isAdmin, CancellationToken ct);
    Task DeleteProjectAsync(int id, int currentUserId, bool isAdmin, CancellationToken ct);
    Task<IReadOnlyList<ProjectMemberDto>> GetMembersAsync(int projectId, int currentUserId, bool isAdmin, CancellationToken ct);
    Task<ProjectMemberDto> AddMemberAsync(int projectId, int userIdToAdd, int currentUserId, bool isAdmin, CancellationToken ct);
    Task RemoveMemberAsync(int projectId, int userIdToRemove, int currentUserId, bool isAdmin, CancellationToken ct);
}