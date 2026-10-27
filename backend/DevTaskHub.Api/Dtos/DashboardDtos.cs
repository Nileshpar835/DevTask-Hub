namespace DevTaskHub.Api.Dtos;

public record TaskStatusBreakdownDto(
    int ToDo,
    int InProgress,
    int InReview,
    int Done
);

public record UrgentTaskSummaryDto(
    int Id,
    int ProjectId,
    string ProjectKey,
    string Title,
    string Priority,
    string Status,
    DateTime? DueDateUtc
);

public record AdminDashboardDto(
    int TotalProjects,
    int TotalActiveProjects,
    int TotalUsers,
    int TotalDevelopers,
    int TotalTasks,
    int OverdueTasksCount,
    TaskStatusBreakdownDto StatusBreakdown,
    IReadOnlyList<TaskActivityLogDto> RecentActivities
);

public record DeveloperDashboardDto(
    int TotalAssignedTasks,
    TaskStatusBreakdownDto StatusBreakdown,
    IReadOnlyList<UrgentTaskSummaryDto> OverdueTasks,
    IReadOnlyList<UrgentTaskSummaryDto> DueSoonTasks,
    IReadOnlyList<ProjectSummaryDto> MyProjects
);