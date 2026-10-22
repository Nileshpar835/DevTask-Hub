using System;
using System.IdentityModel.Tokens.Jwt;
using System.Runtime.Intrinsics.Arm;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DevTaskHub.Api.Domain;
using Microsoft.IdentityModel.Tokens;

namespace DevTaskHub.Api.Services;

public interface ITokenService
{
    (string Token, DateTime ExpiresAtUtc) CreateAccessToken(User user);
    string CreateRefreshToken();
    string HashRefreshToken(string rawToken);
}


public class TokenService : ITokenService
{
    private readonly IConfiguration _config;
    public TokenService(IConfiguration config) => _config = config;
    public (string Token, DateTime ExpiresAtUtc) CreateAccessToken(User user)
    {
        var keytext = _config["Jwt:key"] ?? throw new InvalidOperationException("Jwt: key missiong from configuration.");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keytext));
        var expires = DateTime.UtcNow.AddMinutes(15);

        var claims = new List<Claim>
    {
        new (ClaimTypes.NameIdentifier,user.Id.ToString()),
        new(ClaimTypes.Email,user.Email),
        new(ClaimTypes.Role,user.Role.ToString()),
        new(ClaimTypes.Name,user.FullName),
        new(JwtRegisteredClaimNames.Jti,Guid.NewGuid().ToString())
    };

        var token = new JwtSecurityToken(
            issuer: _config["Jwr:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
    public string CreateRefreshToken() =>
    Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    public string HashRefreshToken(string rawToken) =>
    Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

}
