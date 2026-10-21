using System;
using System.ComponentModel.DataAnnotations;
namespace DevTaskHub.Api.Dtos;

public record RegisterRequest(
    [property: Required, EmailAddress, MaxLength(256)] string Email,
    [property: Required, MinLength(8), MaxLength(100)] string password,
    [property: Required, MaxLength(100)] string FullName);

public record LoginRequest(
    [property: Required, EmailAddress] string Email,
    [property: Required] string password
);

public record AuthUserDto(int Id, string Email, string Fullname, string Role);

