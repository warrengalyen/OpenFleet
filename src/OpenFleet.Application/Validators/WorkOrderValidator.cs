using FluentValidation;
using OpenFleet.Application.DTOs;

namespace OpenFleet.Application.Validators;

public class CreateWorkOrderRequestValidator : AbstractValidator<CreateWorkOrderRequest>
{
    public CreateWorkOrderRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(300).WithMessage("Title must not exceed 300 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).When(x => x.Description is not null)
            .WithMessage("Description must not exceed 2000 characters.");

        RuleFor(x => x)
            .Must(x => x.VehicleId.HasValue && x.VehicleId != Guid.Empty ||
                        x.AssetId.HasValue && x.AssetId != Guid.Empty)
            .WithName("Target")
            .WithMessage("At least one of VehicleId or AssetId must be provided.");
    }
}

public class UpdateWorkOrderRequestValidator : AbstractValidator<UpdateWorkOrderRequest>
{
    public UpdateWorkOrderRequestValidator()
    {
        When(x => x.Title is not null, () =>
        {
            RuleFor(x => x.Title!)
                .NotEmpty().WithMessage("Title must not be empty.")
                .MaximumLength(300).WithMessage("Title must not exceed 300 characters.");
        });

        When(x => x.Description is not null, () =>
        {
            RuleFor(x => x.Description!)
                .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");
        });
    }
}

public class AddNoteRequestValidator : AbstractValidator<AddNoteRequest>
{
    public AddNoteRequestValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Note content is required.")
            .MaximumLength(2000).WithMessage("Note content must not exceed 2000 characters.");

        RuleFor(x => x.AuthorName)
            .NotEmpty().WithMessage("Author name is required.")
            .MaximumLength(100).WithMessage("Author name must not exceed 100 characters.");
    }
}

public class RecordLaborRequestValidator : AbstractValidator<RecordLaborRequest>
{
    public RecordLaborRequestValidator()
    {
        RuleFor(x => x.Hours)
            .GreaterThanOrEqualTo(0).WithMessage("Labor hours must be zero or greater.")
            .LessThanOrEqualTo(1000).WithMessage("Labor hours must not exceed 1000 per entry.");
    }
}

public class CreateMaintenanceRecordRequestValidator : AbstractValidator<CreateMaintenanceRecordRequest>
{
    public CreateMaintenanceRecordRequestValidator()
    {
        RuleFor(x => x.PerformedAt)
            .LessThanOrEqualTo(DateTime.UtcNow).WithMessage("Performed date cannot be in the future.");

        RuleFor(x => x.OdometerReading)
            .GreaterThanOrEqualTo(0).WithMessage("Odometer reading must be zero or greater.");

        RuleFor(x => x.Notes)
            .MaximumLength(2000).When(x => x.Notes is not null)
            .WithMessage("Notes must not exceed 2000 characters.");
    }
}
