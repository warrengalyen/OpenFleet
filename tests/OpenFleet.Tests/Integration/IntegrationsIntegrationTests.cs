using System.Net;
using System.Net.Http.Json;
using OpenFleet.Application.DTOs;
using OpenFleet.Domain.Enums;
using OpenFleet.Tests.Helpers;

namespace OpenFleet.Tests.Integration;

[Collection("Integration")]
public class IntegrationsIntegrationTests
{
    private readonly HttpClient _client;

    public IntegrationsIntegrationTests(OpenFleetWebFactory factory)
    {
        _client = factory.CreateClientWithRole("FleetManager");
    }

    [Fact]
    public async Task GET_integrations_returns_200_with_correct_shape()
    {
        var response = await _client.GetAsync("/api/integrations");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<IntegrationHistoryResponse>();
        Assert.NotNull(body);
        Assert.NotNull(body!.Items);
        Assert.True(body.PageSize > 0);
    }

    [Theory]
    [InlineData("FuelUsage")]
    [InlineData("VendorRepair")]
    [InlineData("PartsSupplier")]
    [InlineData("ExternalAsset")]
    public async Task POST_sync_triggers_import_and_returns_log_entry(string source)
    {
        var response = await _client.PostAsync($"/api/integrations/sync/{source}", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<IntegrationLogResponse>();
        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body!.Id);
        // Status is either Success or Retrying (failed first attempt)
        Assert.True(body.Status == IntegrationStatus.Success || body.Status == IntegrationStatus.Retrying);
        Assert.True(body.AttemptCount >= 1);
    }

    [Fact]
    public async Task GET_integrations_after_sync_shows_history_entry()
    {
        // Trigger a sync to produce a log entry
        await _client.PostAsync("/api/integrations/sync/ExternalAsset", null);

        var response = await _client.GetAsync("/api/integrations?source=ExternalAsset");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<IntegrationHistoryResponse>();
        Assert.NotNull(body);
        Assert.True(body!.TotalCount >= 1);
        Assert.All(body.Items, i => Assert.Equal(IntegrationSource.ExternalAsset, i.Source));
    }

    [Fact]
    public async Task GET_integrations_by_id_returns_detail()
    {
        var syncResponse = await _client.PostAsync("/api/integrations/sync/FuelUsage", null);
        var created = await syncResponse.Content.ReadFromJsonAsync<IntegrationLogResponse>();
        Assert.NotNull(created);

        var response = await _client.GetAsync($"/api/integrations/{created!.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<IntegrationLogResponse>();
        Assert.NotNull(body);
        Assert.Equal(created.Id, body!.Id);
        Assert.Equal(IntegrationSource.FuelUsage, body.Source);
    }

    [Fact]
    public async Task GET_integrations_by_unknown_id_returns_404()
    {
        var response = await _client.GetAsync($"/api/integrations/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task POST_retry_on_unknown_id_returns_404()
    {
        var response = await _client.PostAsync($"/api/integrations/retry/{Guid.NewGuid()}", null);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task POST_retry_on_successful_log_returns_409()
    {
        // Trigger a sync that should succeed (ExternalAsset import always succeeds in mock)
        var syncResponse = await _client.PostAsync("/api/integrations/sync/ExternalAsset", null);
        var log = await syncResponse.Content.ReadFromJsonAsync<IntegrationLogResponse>();
        Assert.NotNull(log);

        if (log!.Status != IntegrationStatus.Success)
            return; // Skip if the first attempt happened to fail

        var response = await _client.PostAsync($"/api/integrations/retry/{log.Id}", null);
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Theory]
    [InlineData("FuelUsage")]
    [InlineData("VendorRepair")]
    [InlineData("PartsSupplier")]
    [InlineData("ExternalAsset")]
    public async Task GET_export_returns_200_with_json_payload(string source)
    {
        var response = await _client.GetAsync($"/api/integrations/export/{source}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<IntegrationLogResponse>();
        Assert.NotNull(body);
        Assert.Equal(IntegrationDirection.Export, body!.Direction);
        // Export should have a non-null payload (could be empty array "[]" but should be JSON)
        Assert.NotNull(body.Payload);
    }

    [Fact]
    public async Task GET_integrations_filters_by_status()
    {
        // Trigger a successful sync
        await _client.PostAsync("/api/integrations/sync/ExternalAsset", null);

        var response = await _client.GetAsync("/api/integrations?status=Success");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<IntegrationHistoryResponse>();
        Assert.NotNull(body);
        Assert.All(body!.Items, i => Assert.Equal(IntegrationStatus.Success, i.Status));
    }
}
