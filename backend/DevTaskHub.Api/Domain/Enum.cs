namespace DevTaskHub.Api.Domain;

public enum UserRole { Admin = 0, Developer = 1 }

public enum ProjectStatus { Active = 0, OnHold = 1, Archived = 2 }

public enum TaskItemStatus { ToDo = 0, InProgress = 1, InReview = 2, Done = 3 }

public enum TaskItemPriority { Low = 0, Medium = 1, High = 2, Critical = 3 }

public enum GitHubPullRequestState { Open = 0, Closed = 1, Merged = 2 }


public enum GitHubReviewStatus
{
    NotReviewed = 0,
    ReviewPending = 1,
    Approved = 2,
    ChangesRequested = 3
}

public enum TaskActivityAction
{
    Created = 0,
    StatusChanged,
    Assigned,
    Unassigned,
    TitleEdited,
    DescriptionEdited,
    PriorityChanged,
    DueDateChanged,
    PullRequestLinked,
    PullRequestUnlinked,
    Reopened
}