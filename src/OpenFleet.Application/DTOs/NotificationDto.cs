namespace OpenFleet.Application.DTOs;

public sealed record WorkOrderStatusChangedNotification(
    Guid WorkOrderId,
    string Title,
    string OldStatus,
    string NewStatus,
    DateTimeOffset OccurredAtUtc);

public sealed record MaintenanceOverdueNotification(
    Guid ScheduleId,
    string ScheduleName,
    string TargetLabel,
    double? DaysOverdue,
    int? MilesOverdue,
    DateTimeOffset OccurredAtUtc);
