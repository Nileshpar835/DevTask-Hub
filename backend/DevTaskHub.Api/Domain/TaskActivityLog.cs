using System;
namespace DevTaskHub.Api.Domain;

public class TaskActivityLog
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public int ProjectId { get; set; }
    public int ActorUserId { get; set; }
    public TaskActivityAction Action { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public TaskItem Task { get; set; } = null!;
    public Project Project { get; set; } = null!;
    public User Actor { get; set; } = null!;
    public object TimestampUtc { get; internal set; }
}