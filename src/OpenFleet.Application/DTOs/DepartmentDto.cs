namespace OpenFleet.Application.DTOs;

public record CreateDepartmentRequest(
    string Name,
    string Code
);

public record UpdateDepartmentRequest(
    string? Name,
    string? Code
);

public record DepartmentResponse(
    Guid Id,
    string Name,
    string Code,
    int VehicleCount,
    int UserCount,
    int AssetCount,
    bool HasAssignments,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
