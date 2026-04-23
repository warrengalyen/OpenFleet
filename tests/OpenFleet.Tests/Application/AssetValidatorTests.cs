using FluentValidation.TestHelper;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Validators;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Tests.Application;

public class AssetValidatorTests
{
    private readonly CreateAssetRequestValidator _validator = new();

    private static CreateAssetRequest Valid() => new(
        AssetTag: "ASSET-001",
        Name: "Hydraulic Lift",
        Type: "Equipment",
        Condition: AssetCondition.Good,
        Status: AssetStatus.Available,
        DepartmentId: Guid.NewGuid(),
        VehicleId: null
    );

    [Fact]
    public void Valid_request_passes()
    {
        var result = _validator.TestValidate(Valid());
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Missing_asset_tag_fails()
    {
        var result = _validator.TestValidate(Valid() with { AssetTag = "" });
        result.ShouldHaveValidationErrorFor(x => x.AssetTag);
    }

    [Fact]
    public void Asset_tag_too_long_fails()
    {
        var result = _validator.TestValidate(Valid() with { AssetTag = new string('A', 51) });
        result.ShouldHaveValidationErrorFor(x => x.AssetTag);
    }

    [Fact]
    public void Missing_name_fails()
    {
        var result = _validator.TestValidate(Valid() with { Name = "" });
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Missing_type_fails()
    {
        var result = _validator.TestValidate(Valid() with { Type = "" });
        result.ShouldHaveValidationErrorFor(x => x.Type);
    }

    [Fact]
    public void Empty_department_fails()
    {
        var result = _validator.TestValidate(Valid() with { DepartmentId = Guid.Empty });
        result.ShouldHaveValidationErrorFor(x => x.DepartmentId);
    }
}
