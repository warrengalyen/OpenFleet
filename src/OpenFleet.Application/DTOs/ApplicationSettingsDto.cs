using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.DTOs;

public record ApplicationSettingsResponse(
    string OrganizationName,
    WorkOrderPriority DefaultWorkOrderPriority,
    int DefaultWorkOrderDueDays,
    bool AutoCreateWorkOrderOnFailedInspection,
    int MaintenanceReminderLeadDays,
    int LowPartsStockThreshold,
    int IntegrationRetryLimit,
    int AuditLogRetentionDays,
    DateTime UpdatedAt
);

public record UpdateApplicationSettingsRequest(
    string OrganizationName,
    WorkOrderPriority DefaultWorkOrderPriority,
    int DefaultWorkOrderDueDays,
    bool AutoCreateWorkOrderOnFailedInspection,
    int MaintenanceReminderLeadDays,
    int LowPartsStockThreshold,
    int IntegrationRetryLimit,
    int AuditLogRetentionDays
);
