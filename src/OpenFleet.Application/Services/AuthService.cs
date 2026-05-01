using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;

namespace OpenFleet.Application.Services;

public class AuthService
{
    private readonly IOpenFleetDbContext _context;
    private readonly JwtSettings _jwtSettings;

    public AuthService(IOpenFleetDbContext context, IOptions<JwtSettings> jwtSettings)
    {
        _context = context;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<Result<LoginResponse>> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (user is null)
            return Result<LoginResponse>.Failure("Invalid email or password.", ErrorCode.Validation);

        if (!user.IsActive)
            return Result<LoginResponse>.Failure("Account is inactive.", ErrorCode.Validation);

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Result<LoginResponse>.Failure("Invalid email or password.", ErrorCode.Validation);

        var expiresAt = DateTime.UtcNow.AddHours(_jwtSettings.ExpiryHours);
        var token = GenerateToken(user.Id, user.Email, user.Role.ToString(), expiresAt);

        return Result<LoginResponse>.Success(new LoginResponse(
            Token: token,
            ExpiresAt: expiresAt,
            UserId: user.Id,
            Email: user.Email,
            Role: user.Role,
            FullName: $"{user.FirstName} {user.LastName}"
        ));
    }

    public async Task<CurrentUserResponse?> GetCurrentUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        return user is null ? null : new CurrentUserResponse(
            user.Id,
            user.Email,
            user.Role,
            $"{user.FirstName} {user.LastName}",
            user.DepartmentId
        );
    }

    private string GenerateToken(Guid userId, string email, string role, DateTime expiresAt)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat,
                DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64)
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
