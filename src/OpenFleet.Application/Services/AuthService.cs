using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.Services;

public class AuthService
{
    public const string DemoProfileRestrictionDetail =
        "Profile changes are unavailable for the shared demo account.";

    public const string DemoPasswordRestrictionDetail =
        "Password changes are unavailable for the shared demo account.";

    private readonly IOpenFleetDbContext _context;
    private readonly JwtSettings _jwtSettings;
    private readonly AuditService _auditService;

    public AuthService(
        IOpenFleetDbContext context,
        IOptions<JwtSettings> jwtSettings,
        AuditService auditService)
    {
        _context = context;
        _jwtSettings = jwtSettings.Value;
        _auditService = auditService;
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

        return user is null ? null : ToCurrentUserResponse(user);
    }

    public async Task<Result<CurrentUserResponse>> UpdateProfileAsync(
        Guid userId,
        UpdateProfileRequest request,
        string? updatedBy = null,
        CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FindAsync([userId], cancellationToken);
        if (user is null || !user.IsActive)
            return Result<CurrentUserResponse>.NotFound("User not found.");

        if (user.IsDemoUser)
        {
            var passwordAttempt = !string.IsNullOrWhiteSpace(request.NewPassword);
            var detail = passwordAttempt
                ? DemoPasswordRestrictionDetail
                : DemoProfileRestrictionDetail;

            await _auditService.LogAsync(
                AuditAction.UserUpdated,
                "User",
                user.Id,
                updatedBy,
                notes: passwordAttempt
                    ? "Rejected demo-account password change attempt."
                    : "Rejected demo-account profile change attempt.",
                cancellationToken: cancellationToken);

            return Result<CurrentUserResponse>.Forbidden(detail);
        }

        var oldSnapshot = $"FirstName={user.FirstName}, LastName={user.LastName}";
        var passwordChanged = false;

        if (request.FirstName is not null)
            user.FirstName = request.FirstName.Trim();

        if (request.LastName is not null)
            user.LastName = request.LastName.Trim();

        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword)
                || !BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return Result<CurrentUserResponse>.Failure(
                    "Current password is incorrect.",
                    ErrorCode.Validation);
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            passwordChanged = true;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var newSnapshot = $"FirstName={user.FirstName}, LastName={user.LastName}";
        await _auditService.LogAsync(
            AuditAction.UserUpdated,
            "User",
            user.Id,
            updatedBy,
            oldValue: oldSnapshot,
            newValue: passwordChanged ? $"{newSnapshot}, PasswordChanged=true" : newSnapshot,
            cancellationToken: cancellationToken);

        return Result<CurrentUserResponse>.Success(ToCurrentUserResponse(user));
    }

    private static CurrentUserResponse ToCurrentUserResponse(User user) =>
        new(
            user.Id,
            user.Email,
            user.Role,
            user.FirstName,
            user.LastName,
            $"{user.FirstName} {user.LastName}",
            user.DepartmentId,
            user.IsDemoUser
        );

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
