using FluentValidation.TestHelper;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Validators;

namespace OpenFleet.Tests.Application;

public class DepartmentValidatorTests
{
    private readonly CreateDepartmentRequestValidator _createValidator = new();
    private readonly UpdateDepartmentRequestValidator _updateValidator = new();

    private static CreateDepartmentRequest ValidCreate() => new(
        Name: "Operations",
        Code: "OPS"
    );

    [Fact]
    public void Valid_create_request_passes()
    {
        var result = _createValidator.TestValidate(ValidCreate());
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Missing_name_fails()
    {
        var result = _createValidator.TestValidate(ValidCreate() with { Name = "" });
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_longer_than_100_chars_fails()
    {
        var result = _createValidator.TestValidate(ValidCreate() with { Name = new string('A', 101) });
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Missing_code_fails()
    {
        var result = _createValidator.TestValidate(ValidCreate() with { Code = "" });
        result.ShouldHaveValidationErrorFor(x => x.Code);
    }

    [Fact]
    public void Code_longer_than_20_chars_fails()
    {
        var result = _createValidator.TestValidate(ValidCreate() with { Code = new string('A', 21) });
        result.ShouldHaveValidationErrorFor(x => x.Code);
    }

    [Fact]
    public void Code_with_lowercase_or_special_chars_fails()
    {
        var result = _createValidator.TestValidate(ValidCreate() with { Code = "ops-1" });
        result.ShouldHaveValidationErrorFor(x => x.Code);
    }

    [Fact]
    public void Update_with_empty_name_fails()
    {
        var result = _updateValidator.TestValidate(new UpdateDepartmentRequest(Name: "", Code: null));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Update_with_empty_code_fails()
    {
        var result = _updateValidator.TestValidate(new UpdateDepartmentRequest(Name: null, Code: ""));
        result.ShouldHaveValidationErrorFor(x => x.Code);
    }
}
