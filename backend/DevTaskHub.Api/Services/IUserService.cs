using System;
using DevTaskHub.Api.Dtos;

namespace DevTaskHub.Api.Services;

public interface IUserService
{
Task<List<UserSummaryDto>> GetAllAsync(CancellationToken ct = default);
}

