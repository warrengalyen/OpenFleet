using System.Net;
using System.Net.Http.Json;
using OpenFleet.Application.DTOs;
using OpenFleet.Domain.Enums;
using OpenFleet.Tests.Helpers;

namespace OpenFleet.Tests.Integration;

[Collection("Integration")]
public class SettingsIntegrationTests
{
    private readonly OpenFleetWebFactory _factory;

    public SettingsIntegrationTests(OpenFleetWebFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GET_settings_with_Viewer_token_returns_200()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var response = await client.GetAsync("/api/settings");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var settings = await response.Content.ReadFromJsonAsync<ApplicationSettingsResponse>();
        Assert.NotNull(settings);
        Assert.False(string.IsNullOrWhiteSpace(settings!.OrganizationName));
    }

    [Fact]
    public async Task PUT_settings_with_Administrator_token_returns_200()
    {
        var client = _factory.CreateClientWithRole("Administrator");
        var request = new UpdateApplicationSettingsRequest(
            OrganizationName: "Integration Fleet",
            DefaultWorkOrderPriority: WorkOrderPriority.Low,
            DefaultWorkOrderDueDays: 14,
            AutoCreateWorkOrderOnFailedInspection: true,
            MaintenanceReminderLeadDays: 10,
            LowPartsStockThreshold: 20,
            IntegrationRetryLimit: 4,
            AuditLogRetentionDays: 90);

        var response = await client.PutAsJsonAsync("/api/settings", request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var updated = await response.Content.ReadFromJsonAsync<ApplicationSettingsResponse>();
        Assert.Equal("Integration Fleet", updated!.OrganizationName);
    }

    [Fact]
    public async Task PUT_settings_with_FleetManager_token_returns_403()
    {
        var client = _factory.CreateClientWithRole("FleetManager");
        var request = new UpdateApplicationSettingsRequest(
            OrganizationName: "Blocked",
            DefaultWorkOrderPriority: WorkOrderPriority.Medium,
            DefaultWorkOrderDueDays: 7,
            AutoCreateWorkOrderOnFailedInspection: true,
            MaintenanceReminderLeadDays: 7,
            LowPartsStockThreshold: 25,
            IntegrationRetryLimit: 3,
            AuditLogRetentionDays: 365);

        var response = await client.PutAsJsonAsync("/api/settings", request);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task PUT_settings_with_invalid_values_returns_400()
    {
        var client = _factory.CreateClientWithRole("Administrator");
        var request = new UpdateApplicationSettingsRequest(
            OrganizationName: "",
            DefaultWorkOrderPriority: WorkOrderPriority.Medium,
            DefaultWorkOrderDueDays: 0,
            AutoCreateWorkOrderOnFailedInspection: true,
            MaintenanceReminderLeadDays: -1,
            LowPartsStockThreshold: 25,
            IntegrationRetryLimit: 3,
            AuditLogRetentionDays: 0);

        var response = await client.PutAsJsonAsync("/api/settings", request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
