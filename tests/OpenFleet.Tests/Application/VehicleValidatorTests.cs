using FluentValidation.TestHelper;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Validators;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Tests.Application;

public class VehicleValidatorTests
{
    private readonly CreateVehicleRequestValidator _validator = new();

    private static CreateVehicleRequest Valid() => new(
        VIN: "1HGBH41JXMN109186",
        LicensePlate: "ABC-1234",
        Make: "Ford",
        Model: "F-150",
        Year: 2022,
        Mileage: 10000,
        Status: VehicleStatus.Active,
        DepartmentId: Guid.NewGuid()
    );

    [Fact]
    public void Valid_request_passes()
    {
        var result = _validator.TestValidate(Valid());
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Missing_VIN_fails()
    {
        var result = _validator.TestValidate(Valid() with { VIN = "" });
        result.ShouldHaveValidationErrorFor(x => x.VIN);
    }

    [Fact]
    public void VIN_longer_than_17_chars_fails()
    {
        var result = _validator.TestValidate(Valid() with { VIN = "1HGBH41JXMN109186A" });
        result.ShouldHaveValidationErrorFor(x => x.VIN);
    }

    [Fact]
    public void VIN_with_invalid_characters_fails()
    {
        var result = _validator.TestValidate(Valid() with { VIN = "1HGBH41JXMN10918I" });
        result.ShouldHaveValidationErrorFor(x => x.VIN);
    }

    [Fact]
    public void Missing_license_plate_fails()
    {
        var result = _validator.TestValidate(Valid() with { LicensePlate = "" });
        result.ShouldHaveValidationErrorFor(x => x.LicensePlate);
    }

    [Fact]
    public void Year_below_1900_fails()
    {
        var result = _validator.TestValidate(Valid() with { Year = 1899 });
        result.ShouldHaveValidationErrorFor(x => x.Year);
    }

    [Fact]
    public void Year_above_next_year_fails()
    {
        var result = _validator.TestValidate(Valid() with { Year = DateTime.UtcNow.Year + 2 });
        result.ShouldHaveValidationErrorFor(x => x.Year);
    }

    [Fact]
    public void Negative_mileage_fails()
    {
        var result = _validator.TestValidate(Valid() with { Mileage = -1 });
        result.ShouldHaveValidationErrorFor(x => x.Mileage);
    }

    [Fact]
    public void Empty_department_fails()
    {
        var result = _validator.TestValidate(Valid() with { DepartmentId = Guid.Empty });
        result.ShouldHaveValidationErrorFor(x => x.DepartmentId);
    }
}
