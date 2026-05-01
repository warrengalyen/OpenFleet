using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.DTOs;

public record LoginRequest(
    string Email,
    string Password
);

public record LoginResponse(
    string Token,
    DateTime ExpiresAt,
    Guid UserId,
    string Email,
    UserRole Role,
    string FullName
);

public record CurrentUserResponse(
    Guid UserId,
    string Email,
    UserRole Role,
    string FullName,
    Guid DepartmentId
);
