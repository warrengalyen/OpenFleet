namespace OpenFleet.Application.DTOs;

public record DepartmentResponse(
    Guid Id,
    string Name,
    string Code,
    int VehicleCount,
    DateTime CreatedAt
);
