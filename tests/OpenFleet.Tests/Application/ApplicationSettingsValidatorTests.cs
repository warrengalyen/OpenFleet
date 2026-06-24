using FluentValidation.TestHelper;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Validators;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Tests.Application;

public class ApplicationSettingsValidatorTests
{
    private readonly UpdateApplicationSettingsRequestValidator _validator = new();

    private static UpdateApplicationSettingsRequest Valid() => new(
        OrganizationName: "Acme Fleet",
        DefaultWorkOrderPriority: WorkOrderPriority.Medium,
        DefaultWorkOrderDueDays: 7,
        AutoCreateWorkOrderOnFailedInspection: true,
        MaintenanceReminderLeadDays: 14,
        LowPartsStockThreshold: 25,
        IntegrationRetryLimit: 3,
        AuditLogRetentionDays: 365);

    [Fact]
    public void Valid_request_passes()
    {
        var result = _validator.TestValidate(Valid());
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Empty_organization_name_fails()
    {
        var result = _validator.TestValidate(Valid() with { OrganizationName = "" });
        result.ShouldHaveValidationErrorFor(x => x.OrganizationName);
    }

    [Fact]
    public void Zero_default_due_days_fails()
    {
        var result = _validator.TestValidate(Valid() with { DefaultWorkOrderDueDays = 0 });
        result.ShouldHaveValidationErrorFor(x => x.DefaultWorkOrderDueDays);
    }

    [Fact]
    public void Zero_audit_retention_days_fails()
    {
        var result = _validator.TestValidate(Valid() with { AuditLogRetentionDays = 0 });
        result.ShouldHaveValidationErrorFor(x => x.AuditLogRetentionDays);
    }
}
