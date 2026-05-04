using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using OpenFleet.Application.DTOs;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;
using OpenFleet.Infrastructure.Persistence;
using OpenFleet.Tests.Helpers;

namespace OpenFleet.Tests.Integration;

[Collection("Integration")]
public class WorkOrdersIntegrationTests
{
    private readonly HttpClient _client;
    private readonly OpenFleetWebFactory _factory;

    public WorkOrdersIntegrationTests(OpenFleetWebFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClientWithRole("Technician");
    }

    private async Task<Guid> SeedVehicleAsync(string vin, string plate)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OpenFleetDbContext>();
        var dept = new Department { Name = "WO Dept " + plate, Code = plate[..3] };
        db.Departments.Add(dept);
        var vehicle = new Vehicle
        {
            VIN = vin, LicensePlate = plate, Make = "Ford", Model = "F-150",
            Year = 2022, Mileage = 1000, Status = VehicleStatus.Active,
            DepartmentId = dept.Id
        };
        db.Vehicles.Add(vehicle);
        await db.SaveChangesAsync();
        return vehicle.Id;
    }

    private async Task<WorkOrderResponse?> CreateWorkOrderAsync(Guid vehicleId, string title = "Test WO")
    {
        var request = new CreateWorkOrderRequest(
            Title: title,
            Description: "Test description",
            Priority: WorkOrderPriority.Medium,
            VehicleId: vehicleId,
            AssetId: null,
            AssignedUserId: null
        );
        var response = await _client.PostAsJsonAsync("/api/workorders", request);
        return await response.Content.ReadFromJsonAsync<WorkOrderResponse>();
    }

    [Fact]
    public async Task GET_workorders_returns_200()
    {
        var response = await _client.GetAsync("/api/workorders");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task POST_workorder_valid_returns_201()
    {
        var vehicleId = await SeedVehicleAsync("WOTEST1234567890A", "WO-001");

        var request = new CreateWorkOrderRequest(
            Title: "Engine service",
            Description: "Full engine service",
            Priority: WorkOrderPriority.High,
            VehicleId: vehicleId,
            AssetId: null,
            AssignedUserId: null
        );

        var response = await _client.PostAsJsonAsync("/api/workorders", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<WorkOrderResponse>();
        Assert.NotNull(created);
        Assert.Equal("Engine service", created!.Title);
        Assert.Equal(WorkOrderStatus.Open, created.Status);
    }

    [Fact]
    public async Task POST_workorder_missing_vehicle_and_asset_returns_400()
    {
        var request = new CreateWorkOrderRequest(
            Title: "Bad WO",
            Description: null,
            Priority: WorkOrderPriority.Low,
            VehicleId: null,
            AssetId: null,
            AssignedUserId: null
        );

        var response = await _client.PostAsJsonAsync("/api/workorders", request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task POST_workorder_missing_title_returns_400()
    {
        var vehicleId = await SeedVehicleAsync("WOTEST2345678901B", "WO-002");

        var request = new CreateWorkOrderRequest(
            Title: "",
            Description: null,
            Priority: WorkOrderPriority.Low,
            VehicleId: vehicleId,
            AssetId: null,
            AssignedUserId: null
        );

        var response = await _client.PostAsJsonAsync("/api/workorders", request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GET_workorder_unknown_id_returns_404()
    {
        var response = await _client.GetAsync($"/api/workorders/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PUT_workorder_updates_and_returns_200()
    {
        var vehicleId = await SeedVehicleAsync("WOTEST3456789012C", "WO-003");
        var created = await CreateWorkOrderAsync(vehicleId, "Initial Title");

        var update = new UpdateWorkOrderRequest(
            Title: "Updated Title",
            Description: "Updated description",
            Priority: WorkOrderPriority.Critical,
            VehicleId: null,
            AssetId: null,
            AssignedUserId: null
        );

        var response = await _client.PutAsJsonAsync($"/api/workorders/{created!.Id}", update);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var updated = await response.Content.ReadFromJsonAsync<WorkOrderResponse>();
        Assert.Equal("Updated Title", updated!.Title);
        Assert.Equal(WorkOrderPriority.Critical, updated.Priority);
    }

    [Fact]
    public async Task PATCH_status_valid_transition_returns_200()
    {
        var vehicleId = await SeedVehicleAsync("WOTEST4567890123D", "WO-004");
        var created = await CreateWorkOrderAsync(vehicleId, "Transition WO");

        var request = new TransitionStatusRequest(WorkOrderStatus.InProgress);
        var response = await _client.PatchAsJsonAsync($"/api/workorders/{created!.Id}/status", request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<WorkOrderResponse>();
        Assert.Equal(WorkOrderStatus.InProgress, result!.Status);
    }

    [Fact]
    public async Task PATCH_status_invalid_transition_returns_409()
    {
        var vehicleId = await SeedVehicleAsync("WOTEST5678901234E", "WO-005");
        var created = await CreateWorkOrderAsync(vehicleId, "Invalid Transition WO");

        // Try to go directly from Open to Completed (invalid)
        var request = new TransitionStatusRequest(WorkOrderStatus.Completed);
        var response = await _client.PatchAsJsonAsync($"/api/workorders/{created!.Id}/status", request);
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task POST_note_returns_201()
    {
        var vehicleId = await SeedVehicleAsync("WOTEST6789012345F", "WO-006");
        var created = await CreateWorkOrderAsync(vehicleId, "Note WO");

        var noteRequest = new AddNoteRequest("First note content", "Tech One");
        var response = await _client.PostAsJsonAsync($"/api/workorders/{created!.Id}/notes", noteRequest);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var note = await response.Content.ReadFromJsonAsync<WorkOrderNoteResponse>();
        Assert.Equal("First note content", note!.Content);
        Assert.Equal("Tech One", note.AuthorName);
    }

    [Fact]
    public async Task GET_notes_returns_notes_list()
    {
        var vehicleId = await SeedVehicleAsync("WOTEST7890123456G", "WO-007");
        var created = await CreateWorkOrderAsync(vehicleId, "Notes List WO");

        await _client.PostAsJsonAsync($"/api/workorders/{created!.Id}/notes",
            new AddNoteRequest("Note A", "Alice"));
        await _client.PostAsJsonAsync($"/api/workorders/{created.Id}/notes",
            new AddNoteRequest("Note B", "Bob"));

        var response = await _client.GetAsync($"/api/workorders/{created.Id}/notes");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var notes = await response.Content.ReadFromJsonAsync<List<WorkOrderNoteResponse>>();
        Assert.Equal(2, notes!.Count);
    }

    [Fact]
    public async Task PUT_labor_records_hours_and_returns_200()
    {
        var vehicleId = await SeedVehicleAsync("WOTEST8901234567H", "WO-008");
        var created = await CreateWorkOrderAsync(vehicleId, "Labor WO");

        var laborRequest = new RecordLaborRequest(2.5m);
        var response = await _client.PutAsJsonAsync($"/api/workorders/{created!.Id}/labor", laborRequest);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var updated = await response.Content.ReadFromJsonAsync<WorkOrderResponse>();
        Assert.Equal(2.5m, updated!.LaborHours);
    }

    [Fact]
    public async Task DELETE_workorder_cancels_and_returns_204()
    {
        var vehicleId = await SeedVehicleAsync("WOTEST9012345678J", "WO-009");
        var created = await CreateWorkOrderAsync(vehicleId, "Cancel WO");

        var deleteResponse = await _client.DeleteAsync($"/api/workorders/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await _client.GetAsync($"/api/workorders/{created.Id}");
        var workOrder = await getResponse.Content.ReadFromJsonAsync<WorkOrderResponse>();
        Assert.Equal(WorkOrderStatus.Cancelled, workOrder!.Status);
    }

    [Fact]
    public async Task POST_maintenance_record_on_non_completed_returns_422()
    {
        var vehicleId = await SeedVehicleAsync("WOTEST0123456789K", "WO-010");
        var created = await CreateWorkOrderAsync(vehicleId, "Maintenance WO");

        var maintenanceRequest = new CreateMaintenanceRecordRequest(
            PerformedAt: DateTime.UtcNow.AddDays(-1),
            OdometerReading: 50000,
            Notes: "Service notes"
        );

        var response = await _client.PostAsJsonAsync(
            $"/api/workorders/{created!.Id}/maintenance-record", maintenanceRequest);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task POST_maintenance_record_on_completed_returns_201()
    {
        var vehicleId = await SeedVehicleAsync("WOTEST1234567890L", "WO-011");
        var created = await CreateWorkOrderAsync(vehicleId, "Complete + Maintenance WO");

        // Transition: Open → InProgress → Completed
        await _client.PatchAsJsonAsync($"/api/workorders/{created!.Id}/status",
            new TransitionStatusRequest(WorkOrderStatus.InProgress));
        await _client.PatchAsJsonAsync($"/api/workorders/{created.Id}/status",
            new TransitionStatusRequest(WorkOrderStatus.Completed));

        var maintenanceRequest = new CreateMaintenanceRecordRequest(
            PerformedAt: DateTime.UtcNow.AddDays(-1),
            OdometerReading: 55000,
            Notes: "All service complete"
        );

        var response = await _client.PostAsJsonAsync(
            $"/api/workorders/{created.Id}/maintenance-record", maintenanceRequest);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var record = await response.Content.ReadFromJsonAsync<MaintenanceRecordResponse>();
        Assert.Equal(55000, record!.OdometerReading);
    }
}
