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
public class InspectionsIntegrationTests
{
    private readonly HttpClient _client;
    private readonly OpenFleetWebFactory _factory;

    public InspectionsIntegrationTests(OpenFleetWebFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<(Guid vehicleId, Guid inspectorId)> SeedVehicleAndUserAsync(string tag)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OpenFleetDbContext>();

        var dept = new Department { Name = $"Insp Dept {tag}", Code = tag[..3].ToUpper() };
        db.Departments.Add(dept);

        var vehicle = new Vehicle
        {
            VIN = $"INSP{tag.PadLeft(13, '0')}",
            LicensePlate = $"INS-{tag}",
            Make = "Ford", Model = "Explorer",
            Year = 2023, Mileage = 5000,
            Status = VehicleStatus.Active,
            DepartmentId = dept.Id
        };
        db.Vehicles.Add(vehicle);

        var user = new User
        {
            FirstName = "Inspector",
            LastName = tag,
            Email = $"inspector-{tag}@openfleet.io",
            Role = UserRole.Technician,
            DepartmentId = dept.Id
        };
        db.Users.Add(user);

        await db.SaveChangesAsync();
        return (vehicle.Id, user.Id);
    }

    [Fact]
    public async Task POST_failed_inspection_returns_201_with_generated_work_order_id()
    {
        var (vehicleId, inspectorId) = await SeedVehicleAndUserAsync("001");

        var request = new CreateInspectionRequest(
            VehicleId: vehicleId,
            AssetId: null,
            InspectorUserId: inspectorId,
            InspectedAt: DateTime.UtcNow.AddMinutes(-10),
            Status: InspectionStatus.Failed,
            Notes: "Brake failure detected."
        );

        var response = await _client.PostAsJsonAsync("/api/inspections", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<InspectionResponse>();
        Assert.NotNull(body);
        Assert.Equal(InspectionStatus.Failed, body!.Status);
        Assert.NotNull(body.GeneratedWorkOrderId);
    }

    [Fact]
    public async Task POST_passed_inspection_returns_201_without_generated_work_order()
    {
        var (vehicleId, inspectorId) = await SeedVehicleAndUserAsync("002");

        var request = new CreateInspectionRequest(
            VehicleId: vehicleId,
            AssetId: null,
            InspectorUserId: inspectorId,
            InspectedAt: DateTime.UtcNow.AddMinutes(-10),
            Status: InspectionStatus.Passed,
            Notes: "All systems go."
        );

        var response = await _client.PostAsJsonAsync("/api/inspections", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<InspectionResponse>();
        Assert.NotNull(body);
        Assert.Equal(InspectionStatus.Passed, body!.Status);
        Assert.Null(body.GeneratedWorkOrderId);
    }

    [Fact]
    public async Task POST_inspection_without_vehicle_or_asset_returns_400()
    {
        var (_, inspectorId) = await SeedVehicleAndUserAsync("003");

        var request = new CreateInspectionRequest(
            VehicleId: null,
            AssetId: null,
            InspectorUserId: inspectorId,
            InspectedAt: DateTime.UtcNow.AddMinutes(-5),
            Status: InspectionStatus.Passed,
            Notes: null
        );

        var response = await _client.PostAsJsonAsync("/api/inspections", request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GET_maintenance_schedules_due_returns_200()
    {
        var response = await _client.GetAsync("/api/maintenance-schedules/due");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<IEnumerable<VehicleDueForServiceResponse>>();
        Assert.NotNull(body);
    }

    [Fact]
    public async Task POST_maintenance_schedule_returns_201()
    {
        var (vehicleId, _) = await SeedVehicleAndUserAsync("004");

        var request = new CreateMaintenanceScheduleRequest(
            Name: "Quarterly Service",
            Description: "Full service every 90 days.",
            VehicleId: vehicleId,
            AssetId: null,
            MileageInterval: null,
            DayInterval: 90
        );

        var response = await _client.PostAsJsonAsync("/api/maintenance-schedules", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<MaintenanceScheduleResponse>();
        Assert.NotNull(body);
        Assert.Equal("Quarterly Service", body!.Name);
        Assert.Equal(90, body.DayInterval);
    }

    [Fact]
    public async Task DELETE_inspection_returns_405()
    {
        var response = await _client.DeleteAsync($"/api/inspections/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.MethodNotAllowed, response.StatusCode);
    }
}
