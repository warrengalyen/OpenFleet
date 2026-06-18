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
public class DepartmentsIntegrationTests
{
    private readonly OpenFleetWebFactory _factory;

    public DepartmentsIntegrationTests(OpenFleetWebFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GET_departments_with_FleetManager_token_returns_200()
    {
        var client = _factory.CreateClientWithRole("FleetManager");
        var response = await client.GetAsync("/api/departments");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task POST_department_with_Administrator_token_returns_201()
    {
        var client = _factory.CreateClientWithRole("Administrator");
        var request = new CreateDepartmentRequest("Warehouse", "WHS");

        var response = await client.PostAsJsonAsync("/api/departments", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<DepartmentResponse>();
        Assert.NotNull(created);
        Assert.Equal("Warehouse", created!.Name);
        Assert.Equal("WHS", created.Code);
    }

    [Fact]
    public async Task POST_department_with_FleetManager_token_returns_403()
    {
        var client = _factory.CreateClientWithRole("FleetManager");
        var request = new CreateDepartmentRequest("Warehouse", "WHS");

        var response = await client.PostAsJsonAsync("/api/departments", request);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task POST_department_with_invalid_body_returns_400()
    {
        var client = _factory.CreateClientWithRole("Administrator");
        var request = new CreateDepartmentRequest("", "bad-code");

        var response = await client.PostAsJsonAsync("/api/departments", request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task POST_department_with_duplicate_code_returns_409()
    {
        var client = _factory.CreateClientWithRole("Administrator");
        var request = new CreateDepartmentRequest("Duplicate Dept", "TST");

        var response = await client.PostAsJsonAsync("/api/departments", request);
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task POST_department_with_duplicate_name_returns_409()
    {
        var client = _factory.CreateClientWithRole("Administrator");
        var request = new CreateDepartmentRequest("Test Department", "NEW");

        var response = await client.PostAsJsonAsync("/api/departments", request);
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task PUT_department_updates_and_returns_200()
    {
        var client = _factory.CreateClientWithRole("Administrator");
        var createResponse = await client.PostAsJsonAsync(
            "/api/departments",
            new CreateDepartmentRequest("Temp Dept", "TMP"));
        var created = await createResponse.Content.ReadFromJsonAsync<DepartmentResponse>();

        var updateResponse = await client.PutAsJsonAsync(
            $"/api/departments/{created!.Id}",
            new UpdateDepartmentRequest("Temp Department", "TMP2"));

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = await updateResponse.Content.ReadFromJsonAsync<DepartmentResponse>();
        Assert.Equal("Temp Department", updated!.Name);
        Assert.Equal("TMP2", updated.Code);
    }

    [Fact]
    public async Task PUT_department_with_FleetManager_token_returns_403()
    {
        var client = _factory.CreateClientWithRole("FleetManager");
        var response = await client.PutAsJsonAsync(
            $"/api/departments/{Guid.NewGuid()}",
            new UpdateDepartmentRequest("Updated", null));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task DELETE_department_without_assignments_returns_204()
    {
        var client = _factory.CreateClientWithRole("Administrator");
        var createResponse = await client.PostAsJsonAsync(
            "/api/departments",
            new CreateDepartmentRequest("Disposable Dept", "DSP"));
        var created = await createResponse.Content.ReadFromJsonAsync<DepartmentResponse>();

        var deleteResponse = await client.DeleteAsync($"/api/departments/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task DELETE_department_with_assigned_users_returns_409()
    {
        var deptId = Guid.Parse("AAAAAAAA-0000-0000-0000-000000000001");
        var client = _factory.CreateClientWithRole("Administrator");

        var response = await client.DeleteAsync($"/api/departments/{deptId}");
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task DELETE_department_with_FleetManager_token_returns_403()
    {
        var client = _factory.CreateClientWithRole("FleetManager");
        var response = await client.DeleteAsync($"/api/departments/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GET_department_by_unknown_id_returns_404()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var response = await client.GetAsync($"/api/departments/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task POST_department_creates_audit_log_entry()
    {
        var client = _factory.CreateClientWithRole("Administrator");
        var createResponse = await client.PostAsJsonAsync(
            "/api/departments",
            new CreateDepartmentRequest("Audit Dept", "AUD"));
        var created = await createResponse.Content.ReadFromJsonAsync<DepartmentResponse>();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OpenFleetDbContext>();
        var auditEntry = db.AuditLogs.FirstOrDefault(
            a => a.EntityId == created!.Id && a.Action == AuditAction.DepartmentCreated);

        Assert.NotNull(auditEntry);
        Assert.Equal("Department", auditEntry!.EntityType);
    }
}
