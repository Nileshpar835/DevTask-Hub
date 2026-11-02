using System;
using System.ComponentModel.DataAnnotations;

namespace DevTaskHub.Api.Dtos;

public record UserSummaryDto(
    int Id,
    string Email,
    string Fullname,
    string Role,
    bool IsActive,
    string? AvatarUrl = null,
    string? GitHubUsername = null,
    int? RoleId = null
);

public record RoleDto(
    int Id,
    string Name,
    string? Description
);

public record ChangeUserRoleRequest(
    [Required] int RoleId
);
