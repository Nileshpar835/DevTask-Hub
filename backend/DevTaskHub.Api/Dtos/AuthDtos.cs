using System;
using System.ComponentModel.DataAnnotations;
namespace DevTaskHub.Api.Dtos;

public record RegisterRequest(
    [ Required, EmailAddress, MaxLength(256)] string Email,
    [ Required, MinLength(8), MaxLength(100)] string password,
    [ Required, MaxLength(100)] string FullName);

public record LoginRequest(
    [ Required, EmailAddress] string Email,
    [ Required] string password
);

public record AuthUserDto(int Id, string Email, string Fullname, string Role);

