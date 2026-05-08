using FluentValidation.TestHelper;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Validators;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Tests.Application;

public class WorkOrderValidatorTests
{
    private readonly CreateWorkOrderRequestValidator _createValidator = new();
    private readonly UpdateWorkOrderRequestValidator _updateValidator = new();
    private readonly AddNoteRequestValidator _noteValidator = new();
    private readonly RecordLaborRequestValidator _laborValidator = new();

    // ── CreateWorkOrderRequest ────────────────────────────────────────────────

    [Fact]
    public void Create_with_valid_request_passes()
    {
        var req = new CreateWorkOrderRequest(
            "Oil Change", "Routine service", WorkOrderPriority.Low,
            VehicleId: Guid.NewGuid(), AssetId: null, AssignedUserId: null);

        var result = _createValidator.TestValidate(req);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Create_with_empty_title_fails()
    {
        var req = new CreateWorkOrderRequest(
            "", null, WorkOrderPriority.Medium,
            VehicleId: Guid.NewGuid(), AssetId: null, AssignedUserId: null);

        _createValidator.TestValidate(req).ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Fact]
    public void Create_with_title_exceeding_300_chars_fails()
    {
        var req = new CreateWorkOrderRequest(
            new string('A', 301), null, WorkOrderPriority.Low,
            VehicleId: Guid.NewGuid(), AssetId: null, AssignedUserId: null);

        _createValidator.TestValidate(req).ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Fact]
    public void Create_without_vehicle_or_asset_fails()
    {
        var req = new CreateWorkOrderRequest(
            "Brake Job", null, WorkOrderPriority.High,
            VehicleId: null, AssetId: null, AssignedUserId: null);

        var result = _createValidator.TestValidate(req);
        result.ShouldHaveValidationErrorFor("Target");
    }

    [Fact]
    public void Create_with_asset_only_passes()
    {
        var req = new CreateWorkOrderRequest(
            "Equipment Service", null, WorkOrderPriority.Low,
            VehicleId: null, AssetId: Guid.NewGuid(), AssignedUserId: null);

        _createValidator.TestValidate(req).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Create_with_description_over_2000_chars_fails()
    {
        var req = new CreateWorkOrderRequest(
            "Title", new string('X', 2001), WorkOrderPriority.Low,
            VehicleId: Guid.NewGuid(), AssetId: null, AssignedUserId: null);

        _createValidator.TestValidate(req).ShouldHaveValidationErrorFor(x => x.Description);
    }

    // ── RecordLaborRequest ────────────────────────────────────────────────────

    [Fact]
    public void RecordLabor_with_negative_hours_fails()
    {
        var result = _laborValidator.TestValidate(new RecordLaborRequest(-1));
        result.ShouldHaveValidationErrorFor(x => x.Hours);
    }

    [Fact]
    public void RecordLabor_with_hours_over_1000_fails()
    {
        var result = _laborValidator.TestValidate(new RecordLaborRequest(1001));
        result.ShouldHaveValidationErrorFor(x => x.Hours);
    }

    [Fact]
    public void RecordLabor_with_zero_hours_passes()
    {
        _laborValidator.TestValidate(new RecordLaborRequest(0)).ShouldNotHaveAnyValidationErrors();
    }

    // ── AddNoteRequest ────────────────────────────────────────────────────────

    [Fact]
    public void AddNote_with_empty_content_fails()
    {
        var result = _noteValidator.TestValidate(new AddNoteRequest("", "Bob Smith"));
        result.ShouldHaveValidationErrorFor(x => x.Content);
    }

    [Fact]
    public void AddNote_with_empty_author_fails()
    {
        var result = _noteValidator.TestValidate(new AddNoteRequest("Oil changed.", ""));
        result.ShouldHaveValidationErrorFor(x => x.AuthorName);
    }

    [Fact]
    public void AddNote_with_valid_data_passes()
    {
        _noteValidator.TestValidate(new AddNoteRequest("Note content.", "Bob Smith"))
            .ShouldNotHaveAnyValidationErrors();
    }
}
