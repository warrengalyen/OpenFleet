using FluentValidation;
using OpenFleet.Application.DTOs;

namespace OpenFleet.Application.Validators;

public class CreateAssetRequestValidator : AbstractValidator<CreateAssetRequest>
{
    public CreateAssetRequestValidator()
    {
        RuleFor(x => x.AssetTag)
            .NotEmpty().WithMessage("Asset tag is required.")
            .MaximumLength(50).WithMessage("Asset tag must not exceed 50 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("Type is required.")
            .MaximumLength(100).WithMessage("Type must not exceed 100 characters.");

        RuleFor(x => x.DepartmentId)
            .NotEmpty().WithMessage("Department is required.");
    }
}

public class UpdateAssetRequestValidator : AbstractValidator<UpdateAssetRequest>
{
    public UpdateAssetRequestValidator()
    {
        When(x => x.AssetTag is not null, () =>
        {
            RuleFor(x => x.AssetTag!)
                .NotEmpty().WithMessage("Asset tag must not be empty.")
                .MaximumLength(50).WithMessage("Asset tag must not exceed 50 characters.");
        });

        When(x => x.Name is not null, () =>
        {
            RuleFor(x => x.Name!)
                .NotEmpty().WithMessage("Name must not be empty.")
                .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");
        });

        When(x => x.Type is not null, () =>
        {
            RuleFor(x => x.Type!)
                .NotEmpty().WithMessage("Type must not be empty.")
                .MaximumLength(100).WithMessage("Type must not exceed 100 characters.");
        });
    }
}
