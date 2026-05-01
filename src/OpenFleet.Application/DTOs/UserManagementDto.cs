using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.DTOs;

public record CreateUserRequest(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    UserRole Role,
    Guid DepartmentId
);

public record UpdateUserRequest(
    string? FirstName,
    string? LastName,
    UserRole? Role,
    Guid? DepartmentId,
    bool? IsActive
);

public record UserResponse(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    UserRole Role,
    bool IsActive,
    Guid DepartmentId,
    string? DepartmentName,
    DateTime CreatedAt
);
