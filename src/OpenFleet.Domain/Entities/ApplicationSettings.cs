using OpenFleet.Domain.Enums;

namespace OpenFleet.Domain.Entities;

/// <summary>
/// Singleton fleet-wide operational settings (single row in the database).
/// </summary>
public class ApplicationSettings : BaseEntity
{
    public string OrganizationName { get; set; } = ApplicationSettingsDefaults.OrganizationName;
    public WorkOrderPriority DefaultWorkOrderPriority { get; set; } = ApplicationSettingsDefaults.DefaultWorkOrderPriority;
    public int DefaultWorkOrderDueDays { get; set; } = ApplicationSettingsDefaults.DefaultWorkOrderDueDays;
    public bool AutoCreateWorkOrderOnFailedInspection { get; set; } = ApplicationSettingsDefaults.AutoCreateWorkOrderOnFailedInspection;
    public int MaintenanceReminderLeadDays { get; set; } = ApplicationSettingsDefaults.MaintenanceReminderLeadDays;
    public int LowPartsStockThreshold { get; set; } = ApplicationSettingsDefaults.LowPartsStockThreshold;
    public int IntegrationRetryLimit { get; set; } = ApplicationSettingsDefaults.IntegrationRetryLimit;
    public int AuditLogRetentionDays { get; set; } = ApplicationSettingsDefaults.AuditLogRetentionDays;
}

public static class ApplicationSettingsDefaults
{
    public static readonly Guid SingletonId = Guid.Parse("99999999-0000-0000-0000-000000000001");
    public const string OrganizationName = "OpenFleet";
    public const WorkOrderPriority DefaultWorkOrderPriority = WorkOrderPriority.Medium;
    public const int DefaultWorkOrderDueDays = 7;
    public const bool AutoCreateWorkOrderOnFailedInspection = true;
    public const int MaintenanceReminderLeadDays = 7;
    public const int LowPartsStockThreshold = 25;
    public const int IntegrationRetryLimit = 3;
    public const int AuditLogRetentionDays = 365;
}
