using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.Interfaces;

/// <summary>
/// Read-only access to persisted application settings for business logic.
/// </summary>
public interface IApplicationSettingsProvider
{
    Task<ApplicationSettingsValues> GetValuesAsync(CancellationToken cancellationToken = default);
}

public record ApplicationSettingsValues(
    string OrganizationName,
    WorkOrderPriority DefaultWorkOrderPriority,
    int DefaultWorkOrderDueDays,
    bool AutoCreateWorkOrderOnFailedInspection,
    int MaintenanceReminderLeadDays,
    int LowPartsStockThreshold,
    int IntegrationRetryLimit,
    int AuditLogRetentionDays
);
