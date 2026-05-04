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
public class AssetsIntegrationTests
{
    private readonly HttpClient _client;
    private readonly OpenFleetWebFactory _factory;

    public AssetsIntegrationTests(OpenFleetWebFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClientWithRole("Technician");
    }

    private async Task<Guid> SeedDepartmentAsync(string code = "AST")
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OpenFleetDbContext>();
        var dept = new Department { Name = $"Asset Dept {code}", Code = code };
        db.Departments.Add(dept);
        await db.SaveChangesAsync();
        return dept.Id;
    }

    private static CreateAssetRequest ValidRequest(Guid departmentId, string tag = "ASSET-TEST-001") => new(
        AssetTag: tag,
        Name: "Test Equipment",
        Type: "Equipment",
        Condition: AssetCondition.Good,
        Status: AssetStatus.Available,
        DepartmentId: departmentId,
        VehicleId: null
    );

    [Fact]
    public async Task GET_assets_returns_200()
    {
        var response = await _client.GetAsync("/api/assets");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task POST_asset_with_valid_body_returns_201()
    {
        var deptId = await SeedDepartmentAsync("A01");

        var response = await _client.PostAsJsonAsync("/api/assets", ValidRequest(deptId, "A01-ASSET"));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<AssetResponse>();
        Assert.NotNull(created);
        Assert.Equal("A01-ASSET", created!.AssetTag);
        Assert.Equal("Test Equipment", created.Name);
    }

    [Fact]
    public async Task POST_asset_with_invalid_body_returns_400()
    {
        var request = new CreateAssetRequest(
            AssetTag: "",
            Name: "",
            Type: "",
            Condition: AssetCondition.Good,
            Status: AssetStatus.Available,
            DepartmentId: Guid.Empty,
            VehicleId: null
        );

        var response = await _client.PostAsJsonAsync("/api/assets", request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GET_asset_by_unknown_id_returns_404()
    {
        var response = await _client.GetAsync($"/api/assets/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PUT_asset_updates_and_returns_200()
    {
        var deptId = await SeedDepartmentAsync("A02");

        var createResponse = await _client.PostAsJsonAsync("/api/assets", ValidRequest(deptId, "A02-PUT"));
        var created = await createResponse.Content.ReadFromJsonAsync<AssetResponse>();

        var updateRequest = new UpdateAssetRequest(
            AssetTag: null,
            Name: "Updated Equipment Name",
            Type: null,
            Condition: AssetCondition.Fair,
            Status: null,
            DepartmentId: null,
            VehicleId: null
        );

        var updateResponse = await _client.PutAsJsonAsync($"/api/assets/{created!.Id}", updateRequest);
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var updated = await updateResponse.Content.ReadFromJsonAsync<AssetResponse>();
        Assert.Equal("Updated Equipment Name", updated!.Name);
        Assert.Equal(AssetCondition.Fair, updated.Condition);
    }

    [Fact]
    public async Task DELETE_asset_sets_status_decommissioned_and_returns_204()
    {
        var deptId = await SeedDepartmentAsync("A03");

        var createResponse = await _client.PostAsJsonAsync("/api/assets", ValidRequest(deptId, "A03-DEL"));
        var created = await createResponse.Content.ReadFromJsonAsync<AssetResponse>();

        var deleteResponse = await _client.DeleteAsync($"/api/assets/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await _client.GetAsync($"/api/assets/{created.Id}");
        var asset = await getResponse.Content.ReadFromJsonAsync<AssetResponse>();
        Assert.Equal(AssetStatus.Decommissioned, asset!.Status);
    }
}
