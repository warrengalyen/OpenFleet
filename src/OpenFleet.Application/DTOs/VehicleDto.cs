using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.DTOs;

public record CreateVehicleRequest(
    string VIN,
    string LicensePlate,
    string Make,
    string Model,
    int Year,
    int Mileage,
    VehicleStatus Status,
    Guid DepartmentId
);

public record UpdateVehicleRequest(
    string? VIN,
    string? LicensePlate,
    string? Make,
    string? Model,
    int? Year,
    int? Mileage,
    VehicleStatus? Status,
    Guid? DepartmentId
);

public record VehicleResponse(
    Guid Id,
    string VIN,
    string LicensePlate,
    string Make,
    string Model,
    int Year,
    int Mileage,
    VehicleStatus Status,
    Guid DepartmentId,
    string DepartmentName,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record VehicleFilterRequest(
    VehicleStatus? Status,
    string? Make,
    string? Model,
    int? Year,
    Guid? DepartmentId,
    string? Search
);
