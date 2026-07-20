using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenFleet.Application.DTOs;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;
using OpenFleet.Infrastructure.Persistence;
using OpenFleet.Tests.Helpers;

namespace OpenFleet.Tests.Integration;

[Collection("Integration")]
public class VehiclesIntegrationTests
{
    private readonly HttpClient _client;
    private readonly OpenFleetWebFactory _factory;

    public VehiclesIntegrationTests(OpenFleetWebFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClientWithRole("Technician");
    }

    private async Task<Guid> SeedDepartmentAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OpenFleetDbContext>();
        var dept = new Department { Name = "Test Dept", Code = "TST" };
        db.Departments.Add(dept);
        await db.SaveChangesAsync();
        return dept.Id;
    }

    [Fact]
    public async Task GET_vehicles_returns_200()
    {
        var response = await _client.GetAsync("/api/vehicles");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task POST_vehicle_with_valid_body_returns_201()
    {
        var deptId = await SeedDepartmentAsync();

        var request = new CreateVehicleRequest(
            VIN: "TESTVCR12345678BC",
            LicensePlate: "TEST-201",
            Make: "Toyota",
            Model: "Camry",
            Year: 2023,
            Mileage: 0,
            Status: VehicleStatus.Active,
            DepartmentId: deptId
        );

        var response = await _client.PostAsJsonAsync("/api/vehicles", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<VehicleResponse>();
        Assert.NotNull(created);
        Assert.Equal("TESTVCR12345678BC", created!.VIN);
        Assert.Equal("TEST-201", created.LicensePlate);
    }

    [Fact]
    public async Task POST_vehicle_with_invalid_body_returns_400()
    {
        var request = new CreateVehicleRequest(
            VIN: "",
            LicensePlate: "",
            Make: "",
            Model: "",
            Year: 1800,
            Mileage: -5,
            Status: VehicleStatus.Active,
            DepartmentId: Guid.Empty
        );

        var response = await _client.PostAsJsonAsync("/api/vehicles", request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GET_vehicle_by_unknown_id_returns_404()
    {
        var response = await _client.GetAsync($"/api/vehicles/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PUT_vehicle_updates_and_returns_200()
    {
        var deptId = await SeedDepartmentAsync();

        var createRequest = new CreateVehicleRequest(
            VIN: "PUTVCR1234567890A",
            LicensePlate: "PUT-001",
            Make: "Honda",
            Model: "Civic",
            Year: 2021,
            Mileage: 5000,
            Status: VehicleStatus.Active,
            DepartmentId: deptId
        );

        var createResponse = await _client.PostAsJsonAsync("/api/vehicles", createRequest);
        var created = await createResponse.Content.ReadFromJsonAsync<VehicleResponse>();

        var updateRequest = new UpdateVehicleRequest(
            VIN: null,
            LicensePlate: null,
            Make: null,
            Model: null,
            Year: null,
            Mileage: 8000,
            Status: null,
            DepartmentId: null
        );

        var updateResponse = await _client.PutAsJsonAsync($"/api/vehicles/{created!.Id}", updateRequest);
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var updated = await updateResponse.Content.ReadFromJsonAsync<VehicleResponse>();
        Assert.Equal(8000, updated!.Mileage);
    }

    [Fact]
    public async Task DELETE_vehicle_soft_deletes_and_returns_204()
    {
        var deptId = await SeedDepartmentAsync();

        var createRequest = new CreateVehicleRequest(
            VIN: "DELVCR12345678ABB",
            LicensePlate: "DEL-001",
            Make: "Nissan",
            Model: "Altima",
            Year: 2020,
            Mileage: 20000,
            Status: VehicleStatus.Active,
            DepartmentId: deptId
        );

        var createResponse = await _client.PostAsJsonAsync("/api/vehicles", createRequest);
        var created = await createResponse.Content.ReadFromJsonAsync<VehicleResponse>();

        var deleteResponse = await _client.DeleteAsync($"/api/vehicles/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await _client.GetAsync($"/api/vehicles/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OpenFleetDbContext>();
        var vehicle = await db.Vehicles
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(v => v.Id == created.Id);
        Assert.NotNull(vehicle);
        Assert.True(vehicle!.IsDeleted);
        Assert.Equal(VehicleStatus.Retired, vehicle.Status);
    }
}
