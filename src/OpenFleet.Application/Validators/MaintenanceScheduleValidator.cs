using FluentValidation;
using OpenFleet.Application.DTOs;

namespace OpenFleet.Application.Validators;

public class CreateMaintenanceScheduleRequestValidator : AbstractValidator<CreateMaintenanceScheduleRequest>
{
    public CreateMaintenanceScheduleRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Schedule name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).When(x => x.Description is not null)
            .WithMessage("Description must not exceed 1000 characters.");

        RuleFor(x => x)
            .Must(x => x.VehicleId.HasValue && x.VehicleId != Guid.Empty ||
                        x.AssetId.HasValue && x.AssetId != Guid.Empty)
            .WithName("Target")
            .WithMessage("At least one of VehicleId or AssetId must be provided.");

        RuleFor(x => x)
            .Must(x => x.MileageInterval.HasValue || x.DayInterval.HasValue)
            .WithName("Interval")
            .WithMessage("At least one of MileageInterval or DayInterval must be provided.");

        When(x => x.MileageInterval.HasValue, () =>
        {
            RuleFor(x => x.MileageInterval!.Value)
                .GreaterThan(0).WithMessage("MileageInterval must be greater than zero.");
        });

        When(x => x.DayInterval.HasValue, () =>
        {
            RuleFor(x => x.DayInterval!.Value)
                .GreaterThan(0).WithMessage("DayInterval must be greater than zero.");
        });
    }
}

public class UpdateMaintenanceScheduleRequestValidator : AbstractValidator<UpdateMaintenanceScheduleRequest>
{
    public UpdateMaintenanceScheduleRequestValidator()
    {
        When(x => x.Name is not null, () =>
        {
            RuleFor(x => x.Name!)
                .NotEmpty().WithMessage("Name must not be empty.")
                .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");
        });

        When(x => x.MileageInterval.HasValue, () =>
        {
            RuleFor(x => x.MileageInterval!.Value)
                .GreaterThan(0).WithMessage("MileageInterval must be greater than zero.");
        });

        When(x => x.DayInterval.HasValue, () =>
        {
            RuleFor(x => x.DayInterval!.Value)
                .GreaterThan(0).WithMessage("DayInterval must be greater than zero.");
        });
    }
}
