using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.DTOs;

public record CreateWorkOrderRequest(
    string Title,
    string? Description,
    WorkOrderPriority? Priority,
    Guid? VehicleId,
    Guid? AssetId,
    Guid? AssignedUserId
);

public record UpdateWorkOrderRequest(
    string? Title,
    string? Description,
    WorkOrderPriority? Priority,
    Guid? VehicleId,
    Guid? AssetId,
    Guid? AssignedUserId
);

public record TransitionStatusRequest(WorkOrderStatus NewStatus);

public record AddNoteRequest(string Content, string AuthorName);

public record RecordLaborRequest(decimal Hours);

public record CreateMaintenanceRecordRequest(
    DateTime PerformedAt,
    int OdometerReading,
    string Notes
);

public record WorkOrderResponse(
    Guid Id,
    string Title,
    string Description,
    WorkOrderStatus Status,
    WorkOrderPriority Priority,
    Guid? VehicleId,
    string? VehicleDescription,
    Guid? AssetId,
    string? AssetDescription,
    Guid? AssignedUserId,
    string? AssignedUserName,
    decimal LaborHours,
    DateTime? DueDate,
    DateTime? CompletedAt,
    int NoteCount,
    WorkOrderStatus[] AllowedNextStatuses,
    bool HasMaintenanceRecord,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record WorkOrderNoteResponse(
    Guid Id,
    Guid WorkOrderId,
    string Content,
    string AuthorName,
    DateTime CreatedAt
);

public record MaintenanceRecordResponse(
    Guid Id,
    Guid WorkOrderId,
    DateTime PerformedAt,
    int OdometerReading,
    string Notes,
    DateTime CreatedAt
);
