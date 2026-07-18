using FluentValidation;
using OpenFleet.Application.DTOs;

namespace OpenFleet.Application.Validators;

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x)
            .Must(HasUpdate)
            .WithMessage("At least one of first name, last name, or new password must be provided.");

        When(x => x.FirstName is not null, () =>
        {
            RuleFor(x => x.FirstName!)
                .NotEmpty().WithMessage("First name cannot be empty.")
                .MaximumLength(100);
        });

        When(x => x.LastName is not null, () =>
        {
            RuleFor(x => x.LastName!)
                .NotEmpty().WithMessage("Last name cannot be empty.")
                .MaximumLength(100);
        });

        When(x => !string.IsNullOrWhiteSpace(x.NewPassword), () =>
        {
            RuleFor(x => x.CurrentPassword)
                .NotEmpty().WithMessage("Current password is required to set a new password.");

            RuleFor(x => x.NewPassword!)
                .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
                .MaximumLength(100).WithMessage("Password must not exceed 100 characters.");
        });
    }

    private static bool HasUpdate(UpdateProfileRequest request) =>
        request.FirstName is not null
        || request.LastName is not null
        || !string.IsNullOrWhiteSpace(request.NewPassword);
}
