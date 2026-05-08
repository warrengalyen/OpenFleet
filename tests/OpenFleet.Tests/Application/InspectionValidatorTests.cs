using FluentValidation.TestHelper;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Validators;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Tests.Application;

public class InspectionValidatorTests
{
    private readonly CreateInspectionRequestValidator _validator = new();

    private static CreateInspectionRequest Valid() => new(
        VehicleId: Guid.NewGuid(),
        AssetId: null,
        InspectorUserId: Guid.NewGuid(),
        InspectedAt: DateTime.UtcNow.AddMinutes(-10),
        Status: InspectionStatus.Passed,
        Notes: null
    );

    [Fact]
    public void Valid_request_passes()
    {
        _validator.TestValidate(Valid()).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Missing_vehicle_and_asset_fails()
    {
        var req = Valid() with { VehicleId = null, AssetId = null };
        _validator.TestValidate(req).ShouldHaveValidationErrorFor("Target");
    }

    [Fact]
    public void Asset_only_passes()
    {
        var req = Valid() with { VehicleId = null, AssetId = Guid.NewGuid() };
        _validator.TestValidate(req).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Empty_inspector_user_fails()
    {
        var req = Valid() with { InspectorUserId = Guid.Empty };
        _validator.TestValidate(req).ShouldHaveValidationErrorFor(x => x.InspectorUserId);
    }

    [Fact]
    public void InspectedAt_more_than_5_minutes_in_future_fails()
    {
        var req = Valid() with { InspectedAt = DateTime.UtcNow.AddMinutes(10) };
        _validator.TestValidate(req).ShouldHaveValidationErrorFor(x => x.InspectedAt);
    }

    [Fact]
    public void InspectedAt_within_5_minutes_in_future_passes()
    {
        // The validator allows up to 5 minutes in the future for clock skew
        var req = Valid() with { InspectedAt = DateTime.UtcNow.AddMinutes(3) };
        _validator.TestValidate(req).ShouldNotHaveValidationErrorFor(x => x.InspectedAt);
    }

    [Fact]
    public void Notes_over_2000_chars_fails()
    {
        var req = Valid() with { Notes = new string('N', 2001) };
        _validator.TestValidate(req).ShouldHaveValidationErrorFor(x => x.Notes);
    }

    [Fact]
    public void Null_notes_passes()
    {
        var req = Valid() with { Notes = null };
        _validator.TestValidate(req).ShouldNotHaveAnyValidationErrors();
    }
}
