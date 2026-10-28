using System;

namespace DevTaskHub.Api.Dtos;

public record PagedResult<T>
(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages,
    bool HasNext,
    bool HasPrevious
);