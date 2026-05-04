using System.Net;
using System.Net.Http.Json;
using OpenFleet.Tests.Helpers;

namespace OpenFleet.Tests.Integration;

/// <summary>
/// Verifies that role guards are enforced correctly across the API.
/// Uses the shared <see cref="OpenFleetWebFactory"/> and <see cref="TestJwtHelper"/> to
/// generate tokens for different roles without hitting the real database.
/// </summary>
[Collection("Integration")]
public class AuthorizationTests
{
    private readonly OpenFleetWebFactory _factory;

    public AuthorizationTests(OpenFleetWebFactory factory)
    {
        _factory = factory;
    }

    // ------- Unauthenticated -------

    [Fact]
    public async Task GET_vehicles_without_token_returns_401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/vehicles");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GET_departments_without_token_returns_401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/departments");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ------- Viewer role — read access -------

    [Fact]
    public async Task GET_vehicles_with_Viewer_token_returns_200()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var response = await client.GetAsync("/api/vehicles");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GET_workorders_with_Viewer_token_returns_200()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var response = await client.GetAsync("/api/workorders");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ------- Viewer role — write blocked -------

    [Fact]
    public async Task DELETE_vehicle_with_Viewer_token_returns_403()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var response = await client.DeleteAsync($"/api/vehicles/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task POST_vehicle_with_Viewer_token_returns_403()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var response = await client.PostAsJsonAsync("/api/vehicles", new { });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ------- Integration sync — FleetManager required -------

    [Fact]
    public async Task POST_integrations_sync_with_Technician_token_returns_403()
    {
        var client = _factory.CreateClientWithRole("Technician");
        var response = await client.PostAsync("/api/integrations/sync/FuelUsage", null);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task POST_integrations_sync_with_FleetManager_token_returns_non_403()
    {
        var client = _factory.CreateClientWithRole("FleetManager");
        var response = await client.PostAsync("/api/integrations/sync/FuelUsage", null);

        // A 200 or other success code is expected; the important thing is NOT 403
        Assert.NotEqual(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ------- Users endpoint — Admin only -------

    [Fact]
    public async Task GET_users_with_FleetManager_token_returns_403()
    {
        var client = _factory.CreateClientWithRole("FleetManager");
        var response = await client.GetAsync("/api/users");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GET_users_with_Administrator_token_returns_200()
    {
        var client = _factory.CreateClientWithRole("Administrator");
        var response = await client.GetAsync("/api/users");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ------- Audit endpoint — FleetManager or above -------

    [Fact]
    public async Task GET_audit_with_Technician_token_returns_403()
    {
        var client = _factory.CreateClientWithRole("Technician");
        var response = await client.GetAsync("/api/audit");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GET_audit_with_FleetManager_token_returns_200()
    {
        var client = _factory.CreateClientWithRole("FleetManager");
        var response = await client.GetAsync("/api/audit");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ------- Maintenance schedules — FleetManager for writes -------

    [Fact]
    public async Task POST_maintenance_schedule_with_Technician_token_returns_403()
    {
        var client = _factory.CreateClientWithRole("Technician");
        var response = await client.PostAsJsonAsync("/api/maintenance-schedules", new { });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
