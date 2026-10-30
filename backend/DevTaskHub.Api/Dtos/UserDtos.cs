using System;

namespace DevTaskHub.Api.Dtos;

public record UserSummaryDto(
    int Id,
    string Email,
    string Fullname,
    string Role,
    bool IsActive,
    string? AvatarUrl = null,
    string? GitHubUsername = null
);
