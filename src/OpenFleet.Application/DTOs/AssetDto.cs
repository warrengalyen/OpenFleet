using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.DTOs;

public record CreateAssetRequest(
    string AssetTag,
    string Name,
    string Type,
    AssetCondition Condition,
    AssetStatus Status,
    Guid DepartmentId,
    Guid? VehicleId
);

public record UpdateAssetRequest(
    string? AssetTag,
    string? Name,
    string? Type,
    AssetCondition? Condition,
    AssetStatus? Status,
    Guid? DepartmentId,
    Guid? VehicleId
);

public record AssetResponse(
    Guid Id,
    string AssetTag,
    string Name,
    string Type,
    AssetCondition Condition,
    AssetStatus Status,
    Guid? DepartmentId,
    string? DepartmentName,
    Guid? VehicleId,
    string? VehicleDescription,
    DateTime PurchaseDate,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
