using System;
using System.ComponentModel.DataAnnotations;
using DevTaskHub.Api.Domain;

namespace DevTaskHub.Api.Dtos;

public record CreateTaskRequest(
    [Required] int ProjectId,
    [Required, MaxLength(200)] string Title,
    [MaxLength(4000)] string? Description,
    [Required] TaskItemPriority Priority,
    DateTime? DueDateUtc,
    int? AssigneeUserId = null,
    [MaxLength(50)] string? Category = null
);

public record UpdateTaskRequest(
    [Required, MaxLength(200)] string Title,
    [MaxLength(4000)] string? Description,
    [Required] TaskItemPriority Priority,
    DateTime? DueDateUtc,
    [MaxLength(50)] string? Category = null
);

public record ChangeTaskStatusRequest(
    [Required] TaskItemStatus Status
);

public record AssignTaskRequest(
    int? AssigneeUserId
);

public record TaskSummaryDto(
    int Id,
    int ProjectId,
    string ProjectKey,
    string ProjectName,
    string Title,
    string Status,
    string Priority,
    int? AssigneeUserId,
    string? AssigneeName,
    int CreatedByUserId,
    string CreatedByName,
    DateTime? DueDateUtc,
    DateTime? CompletedAtUtc,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    string? Category
);

public record TaskDetailDto(
    int Id,
    int ProjectId,
    string ProjectKey,
    string ProjectName,
    string Title,
    string? Description,
    string Status,
    string Priority,
    int? AssigneeUserId,
    string? AssigneeName,
    int CreatedByUserId,
    string CreatedByName,
    DateTime? DueDateUtc,
    DateTime? CompletedAtUtc,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    string? Category
);

public record TaskActivityLogDto(
    int Id,
    int TaskId,
    string Action,
    string? OldValue,
    string? NewValue,
    int UserId,
    string UserFullName,
    DateTime TimestampUtc
);

public class TaskQueryParameters
{
    private const int MaxPageSize = 100;
    private int _pageSize = 20;
    public int Page { get; set; } = 1;
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : (value < 1 ? 1 : value);
    }
    public int? ProjectId { get; set; }
    public int? AssigneeId { get; set; }
    public TaskItemStatus? Status { get; set; }
    public TaskItemPriority? Priority { get; set; }
    public string? Category { get; set; }
    public string? Search { get; set; }
    public bool? Mine { get; set; }
}
