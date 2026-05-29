using FluentValidation;
using OpenFleet.Application.DTOs;

namespace OpenFleet.Application.Validators;

public class CreateVendorRequestValidator : AbstractValidator<CreateVendorRequest>
{
    public CreateVendorRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Vendor name is required.")
            .MaximumLength(200);

        RuleFor(x => x.ContactName)
            .MaximumLength(100);

        RuleFor(x => x.Email)
            .MaximumLength(200)
            .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email))
            .WithMessage("Email must be a valid address.");

        RuleFor(x => x.Phone)
            .MaximumLength(30);

        RuleFor(x => x.Address)
            .MaximumLength(500);
    }
}

public class UpdateVendorRequestValidator : AbstractValidator<UpdateVendorRequest>
{
    public UpdateVendorRequestValidator()
    {
        When(x => x.Name is not null, () =>
        {
            RuleFor(x => x.Name!)
                .NotEmpty().WithMessage("Vendor name cannot be empty.")
                .MaximumLength(200);
        });

        When(x => x.ContactName is not null, () =>
        {
            RuleFor(x => x.ContactName!)
                .MaximumLength(100);
        });

        When(x => x.Email is not null, () =>
        {
            RuleFor(x => x.Email!)
                .MaximumLength(200)
                .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email))
                .WithMessage("Email must be a valid address.");
        });

        When(x => x.Phone is not null, () =>
        {
            RuleFor(x => x.Phone!)
                .MaximumLength(30);
        });

        When(x => x.Address is not null, () =>
        {
            RuleFor(x => x.Address!)
                .MaximumLength(500);
        });
    }
}
