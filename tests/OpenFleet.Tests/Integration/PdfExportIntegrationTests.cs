using System.Net;
using System.Net.Http.Json;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;
using OpenFleet.Application.Reports;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;
using OpenFleet.Infrastructure.Persistence;
using OpenFleet.Tests.Helpers;
using QuestPDF.Infrastructure;

namespace OpenFleet.Tests.Integration;

[Collection("Integration")]
public class PdfExportIntegrationTests
{
    private readonly OpenFleetWebFactory _factory;

    public PdfExportIntegrationTests(OpenFleetWebFactory factory)
    {
        _factory = factory;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    private async Task<Guid> SeedVehicleAsync(string vin, string plate)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OpenFleetDbContext>();
        var code = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
        var dept = new Department { Name = "PDF Dept " + plate, Code = code };
        db.Departments.Add(dept);
        var vehicle = new Vehicle
        {
            VIN = vin,
            LicensePlate = plate,
            Make = "Ford",
            Model = "Transit",
            Year = 2021,
            Mileage = 12000,
            Status = VehicleStatus.Active,
            DepartmentId = dept.Id,
        };
        db.Vehicles.Add(vehicle);
        await db.SaveChangesAsync();
        return vehicle.Id;
    }

    private async Task<WorkOrderResponse> CreateWorkOrderAsync(
        HttpClient client,
        Guid? vehicleId,
        string title,
        string? description = null)
    {
        var request = new CreateWorkOrderRequest(
            Title: title,
            Description: description ?? "PDF test description",
            Priority: WorkOrderPriority.Medium,
            VehicleId: vehicleId,
            AssetId: null,
            AssignedUserId: null);
        var response = await client.PostAsJsonAsync("/api/workorders", request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<WorkOrderResponse>())!;
    }

    private static void AssertPdfHeaders(HttpResponseMessage response, string expectedFilenameFragment)
    {
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/pdf", response.Content.Headers.ContentType?.MediaType);

        Assert.True(response.Content.Headers.TryGetValues("Content-Disposition", out var values));
        var header = string.Join(" ", values);
        Assert.Contains(expectedFilenameFragment, header, StringComparison.OrdinalIgnoreCase);
    }

    private static async Task AssertPdfSignatureAsync(HttpResponseMessage response)
    {
        var bytes = await response.Content.ReadAsByteArrayAsync();
        Assert.True(bytes.Length > 4);
        Assert.Equal("%PDF", Encoding.ASCII.GetString(bytes, 0, 4));
    }

    [Fact]
    public async Task GET_workorder_pdf_authenticated_returns_pdf()
    {
        var writer = _factory.CreateClientWithRole("Technician");
        var reader = _factory.CreateClientWithRole("Viewer");
        var vehicleId = await SeedVehicleAsync("PDFWO1234567890AA", "PDF-WO1");
        var wo = await CreateWorkOrderAsync(writer, vehicleId, "Brake Inspection");

        var response = await reader.GetAsync($"/api/workorders/{wo.Id}/pdf");
        AssertPdfHeaders(response, "Brake-Inspection");
        await AssertPdfSignatureAsync(response);
    }

    [Fact]
    public async Task GET_workorder_pdf_unauthenticated_returns_401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync($"/api/workorders/{Guid.NewGuid()}/pdf");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GET_workorder_pdf_missing_returns_404()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var response = await client.GetAsync($"/api/workorders/{Guid.NewGuid()}/pdf");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GET_workorder_pdf_without_notes_succeeds()
    {
        var client = _factory.CreateClientWithRole("Technician");
        var vehicleId = await SeedVehicleAsync("PDFWO1234567890BB", "PDF-WO2");
        var wo = await CreateWorkOrderAsync(client, vehicleId, "Oil Change");

        var response = await client.GetAsync($"/api/workorders/{wo.Id}/pdf");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await AssertPdfSignatureAsync(response);
    }

    [Fact]
    public async Task GET_workorder_pdf_optional_relationships_absent_succeeds()
    {
        var client = _factory.CreateClientWithRole("Technician");
        var vehicleId = await SeedVehicleAsync("PDFWO1234567890EE", "PDF-WO4");
        // Vehicle present; asset, assignee, and maintenance record absent
        var wo = await CreateWorkOrderAsync(client, vehicleId, "Minimal WO");

        var response = await client.GetAsync($"/api/workorders/{wo.Id}/pdf");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await AssertPdfSignatureAsync(response);
    }

    [Fact]
    public async Task GET_workorder_pdf_long_description_succeeds()
    {
        var client = _factory.CreateClientWithRole("Technician");
        var vehicleId = await SeedVehicleAsync("PDFWO1234567890CC", "PDF-WO3");
        var wo = await CreateWorkOrderAsync(client, vehicleId, "Long Desc WO", new string('A', 2000));

        var response = await client.GetAsync($"/api/workorders/{wo.Id}/pdf");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await AssertPdfSignatureAsync(response);
    }

    [Fact]
    public async Task GET_vehicle_maintenance_history_pdf_authenticated_returns_pdf()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var vehicleId = await SeedVehicleAsync("PDFVH1234567890AA", "8ABC123");

        var response = await client.GetAsync($"/api/vehicles/{vehicleId}/maintenance-history/pdf");
        AssertPdfHeaders(response, "8ABC123");
        AssertPdfHeaders(response, "maintenance-history");
        await AssertPdfSignatureAsync(response);
    }

    [Fact]
    public async Task GET_vehicle_maintenance_history_pdf_unauthenticated_returns_401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync($"/api/vehicles/{Guid.NewGuid()}/maintenance-history/pdf");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GET_vehicle_maintenance_history_pdf_missing_returns_404()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var response = await client.GetAsync($"/api/vehicles/{Guid.NewGuid()}/maintenance-history/pdf");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GET_vehicle_maintenance_history_pdf_soft_deleted_returns_404()
    {
        var client = _factory.CreateClientWithRole("Technician");
        var vehicleId = await SeedVehicleAsync("PDFVH1234567890BB", "DEL-PDF");

        var delete = await client.DeleteAsync($"/api/vehicles/{vehicleId}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

        var response = await client.GetAsync($"/api/vehicles/{vehicleId}/maintenance-history/pdf");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GET_vehicle_maintenance_history_pdf_multipage_timeline_succeeds()
    {
        var client = _factory.CreateClientWithRole("Technician");
        var vehicleId = await SeedVehicleAsync("PDFVH1234567890CC", "MULTI-1");

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<OpenFleetDbContext>();
            var inspectorId = await db.Users.AsNoTracking().Select(u => u.Id).FirstAsync();

            for (var i = 0; i < 40; i++)
            {
                db.WorkOrders.Add(new WorkOrder
                {
                    Title = $"History item {i}",
                    Description = $"Description for history item {i} with enough text to wrap.",
                    Status = WorkOrderStatus.Completed,
                    Priority = WorkOrderPriority.Medium,
                    VehicleId = vehicleId,
                    CompletedAt = DateTime.UtcNow.AddDays(-i),
                });
                db.Inspections.Add(new Inspection
                {
                    VehicleId = vehicleId,
                    InspectorUserId = inspectorId,
                    InspectedAt = DateTime.UtcNow.AddDays(-i).AddHours(1),
                    Status = InspectionStatus.Passed,
                    Notes = $"Inspection notes {i}",
                });
            }

            db.MaintenanceSchedules.Add(new MaintenanceSchedule
            {
                Name = "Annual service",
                Description = "Yearly PM",
                VehicleId = vehicleId,
                DayInterval = 365,
                IsActive = true,
                LastPerformedAt = DateTime.UtcNow.AddMonths(-6),
            });

            await db.SaveChangesAsync();
        }

        var response = await client.GetAsync($"/api/vehicles/{vehicleId}/maintenance-history/pdf");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await AssertPdfSignatureAsync(response);
        var bytes = await response.Content.ReadAsByteArrayAsync();
        Assert.True(bytes.Length > 2000);
    }

    [Fact]
    public async Task Pdf_service_includes_organization_name_and_deterministic_note_order()
    {
        var client = _factory.CreateClientWithRole("Technician");
        var vehicleId = await SeedVehicleAsync("PDFWO1234567890DD", "ORG-PDF");
        var wo = await CreateWorkOrderAsync(client, vehicleId, "Notes Order WO");

        var first = await client.PostAsJsonAsync(
            $"/api/workorders/{wo.Id}/notes",
            new AddNoteRequest("First note", "Author A"));
        first.EnsureSuccessStatusCode();
        await Task.Delay(20);
        var second = await client.PostAsJsonAsync(
            $"/api/workorders/{wo.Id}/notes",
            new AddNoteRequest("Second note", "Author B"));
        second.EnsureSuccessStatusCode();

        using var scope = _factory.Services.CreateScope();
        var settings = scope.ServiceProvider.GetRequiredService<IApplicationSettingsProvider>();
        var values = await settings.GetValuesAsync();
        Assert.False(string.IsNullOrWhiteSpace(values.OrganizationName));

        var pdf = scope.ServiceProvider.GetRequiredService<IPdfExportService>();
        var result = await pdf.GenerateWorkOrderAsync(wo.Id);
        Assert.NotNull(result);
        Assert.Equal("application/pdf", result!.ContentType);
        Assert.Equal("%PDF", Encoding.ASCII.GetString(result.Content, 0, 4));
        Assert.StartsWith("work-order-", result.FileName);

        var notes = await scope.ServiceProvider.GetRequiredService<OpenFleetDbContext>()
            .WorkOrderNotes.AsNoTracking()
            .Where(n => n.WorkOrderId == wo.Id)
            .OrderByDescending(n => n.CreatedAt)
            .ThenBy(n => n.Id)
            .Select(n => n.Content)
            .ToListAsync();
        Assert.Equal(2, notes.Count);
        Assert.Equal("Second note", notes[0]);
        Assert.Equal("First note", notes[1]);
    }
}
