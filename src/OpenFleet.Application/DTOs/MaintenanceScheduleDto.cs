namespace OpenFleet.Application.DTOs;

public record CreateMaintenanceScheduleRequest(
    string Name,
    string? Description,
    Guid? VehicleId,
    Guid? AssetId,
    int? MileageInterval,
    int? DayInterval
);

public record UpdateMaintenanceScheduleRequest(
    string? Name,
    string? Description,
    Guid? VehicleId,
    Guid? AssetId,
    int? MileageInterval,
    int? DayInterval,
    bool? IsActive
);

public record MarkPerformedRequest(
    DateTime PerformedAt,
    int? Mileage
);

public record MaintenanceScheduleResponse(
    Guid Id,
    string Name,
    string Description,
    Guid? VehicleId,
    string? VehicleDescription,
    Guid? AssetId,
    string? AssetDescription,
    int? MileageInterval,
    int? DayInterval,
    DateTime? LastPerformedAt,
    int? LastPerformedMileage,
    bool IsActive,
    bool IsDue,
    DateTime? NextDueDate,
    int? NextDueMileage,
    double? DaysOverdue,
    int? MilesOverdue,
    DateTime CreatedAt
);

public record DueScheduleEntry(
    Guid ScheduleId,
    string ScheduleName,
    bool? IsDueByDate,
    bool? IsDueByMileage,
    DateTime? NextDueDate,
    int? NextDueMileage,
    double? DaysOverdue,
    int? MilesOverdue
);

public record VehicleDueForServiceResponse(
    Guid? VehicleId,
    string? VehicleDescription,
    Guid? AssetId,
    string? AssetDescription,
    int? CurrentMileage,
    DueScheduleEntry[] DueSchedules
);
