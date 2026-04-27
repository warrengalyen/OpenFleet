using FluentValidation;
using OpenFleet.Application.DTOs;

namespace OpenFleet.Application.Validators;

public class CreateInspectionRequestValidator : AbstractValidator<CreateInspectionRequest>
{
    public CreateInspectionRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => x.VehicleId.HasValue && x.VehicleId != Guid.Empty ||
                        x.AssetId.HasValue && x.AssetId != Guid.Empty)
            .WithName("Target")
            .WithMessage("At least one of VehicleId or AssetId must be provided.");

        RuleFor(x => x.InspectorUserId)
            .NotEmpty().WithMessage("Inspector user is required.");

        RuleFor(x => x.InspectedAt)
            .LessThanOrEqualTo(DateTime.UtcNow.AddMinutes(5))
            .WithMessage("Inspection date cannot be more than 5 minutes in the future.");

        RuleFor(x => x.Notes)
            .MaximumLength(2000).When(x => x.Notes is not null)
            .WithMessage("Notes must not exceed 2000 characters.");
    }
}

public class UpdateInspectionRequestValidator : AbstractValidator<UpdateInspectionRequest>
{
    public UpdateInspectionRequestValidator()
    {
        When(x => x.Notes is not null, () =>
        {
            RuleFor(x => x.Notes!)
                .MaximumLength(2000).WithMessage("Notes must not exceed 2000 characters.");
        });
    }
}
