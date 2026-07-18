using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.Services;

public class UserManagementService
{
    private readonly IOpenFleetDbContext _context;
    private readonly AuditService _auditService;

    public UserManagementService(IOpenFleetDbContext context, AuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<Result<UserResponse>> CreateAsync(
        CreateUserRequest request,
        string? createdBy = null,
        CancellationToken cancellationToken = default)
    {
        var emailTaken = await _context.Users
            .AnyAsync(u => u.Email == request.Email, cancellationToken);

        if (emailTaken)
            return Result<UserResponse>.Conflict($"Email '{request.Email}' is already registered.");

        var deptExists = await _context.Departments
            .AnyAsync(d => d.Id == request.DepartmentId, cancellationToken);
        if (!deptExists)
            return Result<UserResponse>.NotFound("Department not found.");

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role,
            DepartmentId = request.DepartmentId,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditAction.UserCreated,
            "User",
            user.Id,
            createdBy,
            notes: $"User '{user.Email}' created with role {user.Role}.",
            cancellationToken: cancellationToken);

        return Result<UserResponse>.Success(await LoadResponseAsync(user.Id, cancellationToken) ?? throw new InvalidOperationException());
    }

    public async Task<Result<UserResponse>> UpdateAsync(
        Guid id,
        UpdateUserRequest request,
        string? updatedBy = null,
        CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FindAsync([id], cancellationToken);
        if (user is null)
            return Result<UserResponse>.NotFound($"User {id} not found.");

        if (user.IsDemoUser)
        {
            if (request.IsActive == false)
            {
                await _auditService.LogAsync(
                    AuditAction.UserUpdated,
                    "User",
                    user.Id,
                    updatedBy,
                    notes: "Rejected demo-account deactivation attempt via user update.",
                    cancellationToken: cancellationToken);

                return Result<UserResponse>.Forbidden(
                    "The shared demo account cannot be deactivated.");
            }

            if (request.FirstName is not null || request.LastName is not null)
            {
                await _auditService.LogAsync(
                    AuditAction.UserUpdated,
                    "User",
                    user.Id,
                    updatedBy,
                    notes: "Rejected demo-account profile change attempt via admin user update.",
                    cancellationToken: cancellationToken);

                return Result<UserResponse>.Forbidden(
                    AuthService.DemoProfileRestrictionDetail);
            }
        }

        var oldSnapshot = $"Role={user.Role}, IsActive={user.IsActive}";

        if (request.FirstName is not null) user.FirstName = request.FirstName;
        if (request.LastName is not null) user.LastName = request.LastName;
        if (request.Role.HasValue) user.Role = request.Role.Value;
        if (request.DepartmentId.HasValue) user.DepartmentId = request.DepartmentId.Value;
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditAction.UserUpdated,
            "User",
            user.Id,
            updatedBy,
            oldValue: oldSnapshot,
            newValue: $"Role={user.Role}, IsActive={user.IsActive}",
            cancellationToken: cancellationToken);

        return Result<UserResponse>.Success(await LoadResponseAsync(id, cancellationToken) ?? throw new InvalidOperationException());
    }

    public async Task<Result<UserResponse>> DeactivateAsync(
        Guid id,
        string? deactivatedBy = null,
        CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FindAsync([id], cancellationToken);
        if (user is null)
            return Result<UserResponse>.NotFound($"User {id} not found.");

        if (user.IsDemoUser)
        {
            await _auditService.LogAsync(
                AuditAction.UserDeactivated,
                "User",
                user.Id,
                deactivatedBy,
                notes: "Rejected demo-account deactivation attempt.",
                cancellationToken: cancellationToken);

            return Result<UserResponse>.Forbidden(
                "The shared demo account cannot be deactivated.");
        }

        user.IsActive = false;
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditAction.UserDeactivated,
            "User",
            user.Id,
            deactivatedBy,
            notes: $"User '{user.Email}' deactivated.",
            cancellationToken: cancellationToken);

        return Result<UserResponse>.Success(await LoadResponseAsync(id, cancellationToken) ?? throw new InvalidOperationException());
    }

    public async Task<IReadOnlyList<UserResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Include(u => u.Department)
            .AsNoTracking()
            .OrderBy(u => u.LastName)
            .Select(u => ToResponse(u))
            .ToListAsync(cancellationToken);
    }

    public async Task<UserResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await LoadResponseAsync(id, cancellationToken);

    private async Task<UserResponse?> LoadResponseAsync(Guid id, CancellationToken ct)
    {
        var u = await _context.Users
            .Include(x => x.Department)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        return u is null ? null : ToResponse(u);
    }

    public static UserResponse ToResponse(User u) => new(
        u.Id,
        u.FirstName,
        u.LastName,
        u.Email,
        u.Role,
        u.IsActive,
        u.DepartmentId,
        u.Department?.Name,
        u.CreatedAt
    );
}
