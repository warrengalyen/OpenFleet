using FluentValidation;
using OpenFleet.Application.DTOs;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.Validators;

public class UpdateApplicationSettingsRequestValidator : AbstractValidator<UpdateApplicationSettingsRequest>
{
    public UpdateApplicationSettingsRequestValidator()
    {
        RuleFor(x => x.OrganizationName)
            .NotEmpty().WithMessage("Organization name is required.")
            .MaximumLength(200);

        RuleFor(x => x.DefaultWorkOrderPriority)
            .IsInEnum().WithMessage("Default work order priority is invalid.");

        RuleFor(x => x.DefaultWorkOrderDueDays)
            .GreaterThan(0).WithMessage("Default work order due days must be greater than zero.");

        RuleFor(x => x.MaintenanceReminderLeadDays)
            .GreaterThanOrEqualTo(0).WithMessage("Maintenance reminder lead days must be zero or greater.");

        RuleFor(x => x.LowPartsStockThreshold)
            .GreaterThanOrEqualTo(0).WithMessage("Low parts stock threshold must be zero or greater.");

        RuleFor(x => x.IntegrationRetryLimit)
            .GreaterThanOrEqualTo(0).WithMessage("Integration retry limit must be zero or greater.");

        RuleFor(x => x.AuditLogRetentionDays)
            .GreaterThan(0).WithMessage("Audit log retention days must be greater than zero.");
    }
}
