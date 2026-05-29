using FluentValidation;
using OpenFleet.Application.DTOs;

namespace OpenFleet.Application.Validators;

public class CreatePartRequestValidator : AbstractValidator<CreatePartRequest>
{
    public CreatePartRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Part name is required.")
            .MaximumLength(200);

        RuleFor(x => x.PartNumber)
            .NotEmpty().WithMessage("Part number is required.")
            .MaximumLength(100);

        RuleFor(x => x.VendorId)
            .NotEmpty().WithMessage("Vendor is required.");

        RuleFor(x => x.QuantityOnHand)
            .GreaterThanOrEqualTo(0).WithMessage("Quantity on hand must be zero or greater.");

        RuleFor(x => x.UnitCost)
            .GreaterThanOrEqualTo(0).WithMessage("Unit cost must be zero or greater.");
    }
}

public class UpdatePartRequestValidator : AbstractValidator<UpdatePartRequest>
{
    public UpdatePartRequestValidator()
    {
        When(x => x.Name is not null, () =>
        {
            RuleFor(x => x.Name!)
                .NotEmpty().WithMessage("Part name cannot be empty.")
                .MaximumLength(200);
        });

        When(x => x.PartNumber is not null, () =>
        {
            RuleFor(x => x.PartNumber!)
                .NotEmpty().WithMessage("Part number cannot be empty.")
                .MaximumLength(100);
        });

        When(x => x.QuantityOnHand.HasValue, () =>
        {
            RuleFor(x => x.QuantityOnHand!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Quantity on hand must be zero or greater.");
        });

        When(x => x.UnitCost.HasValue, () =>
        {
            RuleFor(x => x.UnitCost!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Unit cost must be zero or greater.");
        });
    }
}
