using DevTaskHub.Api.Dtos;

namespace DevTaskHub.Api.Services;

public interface ITaskService
{
    Task<PagedResult<TaskSummaryDto>> GetTasksAsync(int currentUserId, bool isAdmin, TaskQueryParameters query, CancellationToken ct);
    Task<TaskDetailDto> GetTaskByIdAsync(int id, int currentUserId, bool isAdmin, CancellationToken ct);
    Task<TaskDetailDto> CreateTaskAsync(CreateTaskRequest request, int currentUserId, bool isAdmin, CancellationToken ct);
    Task<TaskDetailDto> UpdateTaskAsync(int id, UpdateTaskRequest request, int currentUserId, bool isAdmin, CancellationToken ct);
    Task<TaskDetailDto> ChangeStatusAsync(int id, ChangeTaskStatusRequest request, int currentUserId, bool isAdmin, CancellationToken ct);
    Task<TaskDetailDto> AssignTaskAsync(int id, AssignTaskRequest request, int currentUserId, bool isAdmin, CancellationToken ct);
    Task DeleteTaskAsync(int id, int currentUserId, bool isAdmin, CancellationToken ct);
    Task<IReadOnlyList<TaskActivityLogDto>> GetActivityLogsAsync(int taskId, int currentUserId, bool isAdmin, CancellationToken ct);
    Task<IReadOnlyList<string>> GetCategoriesAsync(CancellationToken ct);
}
