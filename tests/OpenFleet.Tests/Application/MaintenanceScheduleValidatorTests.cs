using FluentValidation.TestHelper;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Validators;

namespace OpenFleet.Tests.Application;

public class MaintenanceScheduleValidatorTests
{
    private readonly CreateMaintenanceScheduleRequestValidator _createValidator = new();
    private readonly UpdateMaintenanceScheduleRequestValidator _updateValidator = new();

    private static CreateMaintenanceScheduleRequest ValidCreate() => new(
        Name: "Oil Change",
        Description: null,
        VehicleId: Guid.NewGuid(),
        AssetId: null,
        MileageInterval: 5000,
        DayInterval: null
    );

    // ── CreateMaintenanceScheduleRequest ──────────────────────────────────────

    [Fact]
    public void Create_with_valid_request_passes()
    {
        _createValidator.TestValidate(ValidCreate()).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Create_with_empty_name_fails()
    {
        var req = ValidCreate() with { Name = "" };
        _createValidator.TestValidate(req).ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Create_with_name_over_200_chars_fails()
    {
        var req = ValidCreate() with { Name = new string('A', 201) };
        _createValidator.TestValidate(req).ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Create_without_vehicle_or_asset_fails()
    {
        var req = ValidCreate() with { VehicleId = null, AssetId = null };
        _createValidator.TestValidate(req).ShouldHaveValidationErrorFor("Target");
    }

    [Fact]
    public void Create_with_asset_only_passes()
    {
        var req = ValidCreate() with { VehicleId = null, AssetId = Guid.NewGuid() };
        _createValidator.TestValidate(req).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Create_without_any_interval_fails()
    {
        var req = ValidCreate() with { MileageInterval = null, DayInterval = null };
        _createValidator.TestValidate(req).ShouldHaveValidationErrorFor("Interval");
    }

    [Fact]
    public void Create_with_day_interval_only_passes()
    {
        var req = ValidCreate() with { MileageInterval = null, DayInterval = 90 };
        _createValidator.TestValidate(req).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Create_with_zero_mileage_interval_fails()
    {
        var req = ValidCreate() with { MileageInterval = 0 };
        // FluentValidation property path for nullable.Value is "MileageInterval.Value"
        var result = _createValidator.TestValidate(req);
        result.ShouldHaveAnyValidationError();
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("MileageInterval"));
    }

    [Fact]
    public void Create_with_zero_day_interval_fails()
    {
        var req = ValidCreate() with { MileageInterval = null, DayInterval = 0 };
        var result = _createValidator.TestValidate(req);
        result.ShouldHaveAnyValidationError();
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("DayInterval"));
    }

    [Fact]
    public void Create_with_description_over_1000_chars_fails()
    {
        var req = ValidCreate() with { Description = new string('D', 1001) };
        _createValidator.TestValidate(req).ShouldHaveValidationErrorFor(x => x.Description);
    }

    // ── UpdateMaintenanceScheduleRequest ──────────────────────────────────────

    [Fact]
    public void Update_with_empty_name_fails()
    {
        var req = new UpdateMaintenanceScheduleRequest("", null, null, null, null, null, null);
        _updateValidator.TestValidate(req).ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Update_with_null_fields_passes()
    {
        var req = new UpdateMaintenanceScheduleRequest(null, null, null, null, null, null, null);
        _updateValidator.TestValidate(req).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Update_with_negative_day_interval_fails()
    {
        var req = new UpdateMaintenanceScheduleRequest(null, null, null, null, null, -1, null);
        var result = _updateValidator.TestValidate(req);
        result.ShouldHaveAnyValidationError();
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("DayInterval"));
    }
}
