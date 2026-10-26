using System.ComponentModel.DataAnnotations;
using DevTaskHub.Api.Domain;
namespace DevTaskHub.Api.Dtos;

public record CreateProjectRequest(
    [Required, RegularExpression(@"^[A-Z0-9]{2,10}$", ErrorMessage = "Key must be 2-10 uppercase alphanumeric characters (e.g. 'DEV', 'TASK').")]
    string Key,
    [Required,MaxLength(150)]
    string Name,
    [MaxLength(2000)]
    string? Description
);

public record UpdateProjectRequest(
    [Required, MaxLength(150)]
    string Name,
    [MaxLength(2000)]
    string? Description,
    [Required]
    ProjectStatus Status
);

public record ProjectSummaryDto(
    int Id,
    string Key,
    string Name,
    string? Description,
    string Status,
    int OwnerUserId,
    string OwnerName,
    int MemberCount,
    int TaskCount,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc
);

public record ProjectMemberDto(
    int Id,
    int UserId,
    string Email,
    string FullName,
    string Role,
    DateTime AddedAtUtc
);

public record ProjectDetailDto(
    int Id,
    string Key,
    string Name,
    string? Description,
    string Status,
    int OwnerUserId,
    string OwnerName,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    IReadOnlyList<ProjectMemberDto> Members
);
public record AddProjectMemberRequest(
    [Required] int UserId
);
public class ProjectQueryParameters
{
    private const int MaxPageSize = 100;
    private int _pageSize = 20;
    public int Page { get; set; } = 1;
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : (value < 1 ? 1 : value);
    }
    public string? Search { get; set; }
    public ProjectStatus? Status { get; set; }
    public bool? Mine { get; set; }
}