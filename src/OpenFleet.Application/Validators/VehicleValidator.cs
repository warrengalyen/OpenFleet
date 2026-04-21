using FluentValidation;
using OpenFleet.Application.DTOs;

namespace OpenFleet.Application.Validators;

public class CreateVehicleRequestValidator : AbstractValidator<CreateVehicleRequest>
{
    public CreateVehicleRequestValidator()
    {
        RuleFor(x => x.VIN)
            .NotEmpty().WithMessage("VIN is required.")
            .MaximumLength(17).WithMessage("VIN must not exceed 17 characters.")
            .Matches(@"^[A-HJ-NPR-Z0-9]+$").WithMessage("VIN must be alphanumeric (no I, O, or Q).");

        RuleFor(x => x.LicensePlate)
            .NotEmpty().WithMessage("License plate is required.")
            .MaximumLength(20).WithMessage("License plate must not exceed 20 characters.");

        RuleFor(x => x.Make)
            .NotEmpty().WithMessage("Make is required.")
            .MaximumLength(100);

        RuleFor(x => x.Model)
            .NotEmpty().WithMessage("Model is required.")
            .MaximumLength(100);

        RuleFor(x => x.Year)
            .InclusiveBetween(1900, DateTime.UtcNow.Year + 1)
            .WithMessage($"Year must be between 1900 and {DateTime.UtcNow.Year + 1}.");

        RuleFor(x => x.Mileage)
            .GreaterThanOrEqualTo(0).WithMessage("Mileage must be zero or greater.");

        RuleFor(x => x.DepartmentId)
            .NotEmpty().WithMessage("Department is required.");
    }
}

public class UpdateVehicleRequestValidator : AbstractValidator<UpdateVehicleRequest>
{
    public UpdateVehicleRequestValidator()
    {
        When(x => x.VIN is not null, () =>
        {
            RuleFor(x => x.VIN!)
                .MaximumLength(17).WithMessage("VIN must not exceed 17 characters.")
                .Matches(@"^[A-HJ-NPR-Z0-9]+$").WithMessage("VIN must be alphanumeric (no I, O, or Q).");
        });

        When(x => x.LicensePlate is not null, () =>
        {
            RuleFor(x => x.LicensePlate!)
                .MaximumLength(20).WithMessage("License plate must not exceed 20 characters.");
        });

        When(x => x.Year.HasValue, () =>
        {
            RuleFor(x => x.Year!.Value)
                .InclusiveBetween(1900, DateTime.UtcNow.Year + 1)
                .WithMessage($"Year must be between 1900 and {DateTime.UtcNow.Year + 1}.");
        });

        When(x => x.Mileage.HasValue, () =>
        {
            RuleFor(x => x.Mileage!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Mileage must be zero or greater.");
        });
    }
}
