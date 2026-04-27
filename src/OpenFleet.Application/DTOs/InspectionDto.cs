using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.DTOs;

public record CreateInspectionRequest(
    Guid? VehicleId,
    Guid? AssetId,
    Guid InspectorUserId,
    DateTime InspectedAt,
    InspectionStatus Status,
    string? Notes
);

public record UpdateInspectionRequest(
    InspectionStatus? Status,
    string? Notes
);

public record InspectionResponse(
    Guid Id,
    Guid? VehicleId,
    string? VehicleDescription,
    Guid? AssetId,
    string? AssetDescription,
    Guid InspectorUserId,
    string InspectorName,
    DateTime InspectedAt,
    InspectionStatus Status,
    string Notes,
    Guid? GeneratedWorkOrderId,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
