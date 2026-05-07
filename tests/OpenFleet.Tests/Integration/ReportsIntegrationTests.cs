using System.Net;
using System.Net.Http.Json;
using OpenFleet.Application.DTOs;
using OpenFleet.Tests.Helpers;

namespace OpenFleet.Tests.Integration;

/// <summary>
/// Integration tests for the /api/reports/* endpoints.
/// Verifies authentication enforcement and that all endpoints return well-formed responses.
/// </summary>
[Collection("Integration")]
public class ReportsIntegrationTests
{
    private readonly OpenFleetWebFactory _factory;

    public ReportsIntegrationTests(OpenFleetWebFactory factory)
    {
        _factory = factory;
    }

    // ── Unauthenticated access is blocked ─────────────────────────────────────

    [Fact]
    public async Task GET_any_report_without_token_returns_401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/reports/work-orders-by-status");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── All 8 endpoints return 200 for an authenticated Viewer ────────────────

    [Theory]
    [InlineData("/api/reports/open-work-orders")]
    [InlineData("/api/reports/vehicles-due")]
    [InlineData("/api/reports/maintenance-cost")]
    [InlineData("/api/reports/parts-usage")]
    [InlineData("/api/reports/vehicle-downtime")]
    [InlineData("/api/reports/inspection-failure-rate")]
    [InlineData("/api/reports/work-orders-by-status")]
    [InlineData("/api/reports/work-orders-by-priority")]
    public async Task GET_report_endpoint_with_Viewer_token_returns_200(string path)
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Response shapes deserialize correctly ─────────────────────────────────

    [Fact]
    public async Task GET_open_work_orders_returns_valid_shape()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var body = await client.GetFromJsonAsync<OpenWorkOrdersReport>("/api/reports/open-work-orders");

        Assert.NotNull(body);
        Assert.Equal(body!.Open + body.InProgress + body.WaitingForParts, body.TotalOpen);
        Assert.NotNull(body.Items);
    }

    [Fact]
    public async Task GET_vehicles_due_returns_valid_shape()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var body = await client.GetFromJsonAsync<VehiclesDueForServiceReport>("/api/reports/vehicles-due");

        Assert.NotNull(body);
        Assert.Equal(body!.TotalDue, body.Vehicles.Count);
    }

    [Fact]
    public async Task GET_maintenance_cost_returns_valid_shape()
    {
        var client = _factory.CreateClientWithRole("FleetManager");
        var body = await client.GetFromJsonAsync<MaintenanceCostReport>("/api/reports/maintenance-cost");

        Assert.NotNull(body);
        Assert.NotNull(body!.Vehicles);
        Assert.All(body.Vehicles, v => Assert.True(v.TotalLaborHours >= 0));
    }

    [Fact]
    public async Task GET_parts_usage_returns_valid_shape_with_inventory_value()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var body = await client.GetFromJsonAsync<PartUsageReport>("/api/reports/parts-usage");

        Assert.NotNull(body);
        Assert.True(body!.TotalParts >= 0);
        Assert.True(body.TotalInventoryValue >= 0);
    }

    [Fact]
    public async Task GET_vehicle_downtime_returns_valid_shape()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var body = await client.GetFromJsonAsync<VehicleDowntimeReport>("/api/reports/vehicle-downtime");

        Assert.NotNull(body);
        Assert.NotNull(body!.Vehicles);
    }

    [Fact]
    public async Task GET_inspection_failure_rate_total_equals_sum_of_outcomes()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var body = await client.GetFromJsonAsync<InspectionFailureRateReport>("/api/reports/inspection-failure-rate");

        Assert.NotNull(body);
        Assert.Equal(body!.TotalInspections, body.Passed + body.Failed + body.NeedsReview);
        Assert.True(body.FailureRatePercent >= 0 && body.FailureRatePercent <= 100);
    }

    [Fact]
    public async Task GET_work_orders_by_status_total_is_consistent()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var body = await client.GetFromJsonAsync<WorkOrdersByStatusReport>("/api/reports/work-orders-by-status");

        Assert.NotNull(body);
        Assert.Equal(
            body!.Open + body.InProgress + body.WaitingForParts + body.Completed + body.Cancelled,
            body.Total);
    }

    [Fact]
    public async Task GET_work_orders_by_priority_total_is_consistent()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var body = await client.GetFromJsonAsync<WorkOrdersByPriorityReport>("/api/reports/work-orders-by-priority");

        Assert.NotNull(body);
        Assert.Equal(
            body!.Low + body.Medium + body.High + body.Critical,
            body.Total);
    }
}
