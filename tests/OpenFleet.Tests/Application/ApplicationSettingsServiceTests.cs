using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Services;
using OpenFleet.Domain.Enums;
using OpenFleet.Infrastructure.Persistence;
using OpenFleet.Tests.Helpers;

namespace OpenFleet.Tests.Application;

public class ApplicationSettingsServiceTests : IDisposable
{
    private readonly OpenFleetDbContext _context;
    private readonly ApplicationSettingsService _service;

    public ApplicationSettingsServiceTests()
    {
        var options = new DbContextOptionsBuilder<OpenFleetDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new OpenFleetDbContext(options);
        var auditService = new AuditService(_context);
        _service = new ApplicationSettingsService(_context, auditService);
    }

    public void Dispose() => _context.Dispose();

    [Fact]
    public async Task GetAsync_creates_defaults_when_missing()
    {
        var settings = await _service.GetAsync();

        Assert.Equal("OpenFleet", settings.OrganizationName);
        Assert.Equal(WorkOrderPriority.Medium, settings.DefaultWorkOrderPriority);
        Assert.Equal(7, settings.DefaultWorkOrderDueDays);
    }

    [Fact]
    public async Task UpdateAsync_persists_changes()
    {
        var request = new UpdateApplicationSettingsRequest(
            OrganizationName: "Metro Fleet",
            DefaultWorkOrderPriority: WorkOrderPriority.High,
            DefaultWorkOrderDueDays: 10,
            AutoCreateWorkOrderOnFailedInspection: false,
            MaintenanceReminderLeadDays: 5,
            LowPartsStockThreshold: 15,
            IntegrationRetryLimit: 2,
            AuditLogRetentionDays: 180);

        var result = await _service.UpdateAsync(request, "admin@openfleet.io");

        Assert.True(result.IsSuccess);
        Assert.Equal("Metro Fleet", result.Value!.OrganizationName);
        Assert.False(result.Value.AutoCreateWorkOrderOnFailedInspection);
    }
}
