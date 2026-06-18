using FluentValidation;
using OpenFleet.Application.DTOs;

namespace OpenFleet.Application.Validators;

public class CreateDepartmentRequestValidator : AbstractValidator<CreateDepartmentRequest>
{
    public CreateDepartmentRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Department name is required.")
            .MaximumLength(100);

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Department code is required.")
            .MaximumLength(20)
            .Matches("^[A-Z0-9]+$")
            .WithMessage("Department code must contain only uppercase letters and numbers.");
    }
}

public class UpdateDepartmentRequestValidator : AbstractValidator<UpdateDepartmentRequest>
{
    public UpdateDepartmentRequestValidator()
    {
        When(x => x.Name is not null, () =>
        {
            RuleFor(x => x.Name!)
                .NotEmpty().WithMessage("Department name cannot be empty.")
                .MaximumLength(100);
        });

        When(x => x.Code is not null, () =>
        {
            RuleFor(x => x.Code!)
                .NotEmpty().WithMessage("Department code cannot be empty.")
                .MaximumLength(20)
                .Matches("^[A-Z0-9]+$")
                .WithMessage("Department code must contain only uppercase letters and numbers.");
        });
    }
}
