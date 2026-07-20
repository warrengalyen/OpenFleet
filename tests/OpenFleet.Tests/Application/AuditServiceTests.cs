using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Services;
using OpenFleet.Domain.Enums;
using OpenFleet.Infrastructure.Persistence;

namespace OpenFleet.Tests.Application;

public class AuditServiceTests : IDisposable
{
    private readonly OpenFleetDbContext _context;
    private readonly AuditService _service;

    public AuditServiceTests()
    {
        var options = new DbContextOptionsBuilder<OpenFleetDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new OpenFleetDbContext(options);
        _service = new AuditService(_context);
    }

    public void Dispose() => _context.Dispose();

    [Fact]
    public async Task LogAsync_persists_audit_entry_with_correct_fields()
    {
        var entityId = Guid.NewGuid();

        await _service.LogAsync(
            AuditAction.VehicleUpdated,
            "Vehicle",
            entityId,
            changedBy: "alice@openfleet.io",
            oldValue: "Status=Active",
            newValue: "Status=InMaintenance",
            notes: "Scheduled maintenance.");

        var logs = await _context.AuditLogs.ToListAsync();
        Assert.Single(logs);

        var log = logs[0];
        Assert.Equal(AuditAction.VehicleUpdated, log.Action);
        Assert.Equal("Vehicle", log.EntityType);
        Assert.Equal(entityId, log.EntityId);
        Assert.Equal("alice@openfleet.io", log.ChangedBy);
        Assert.Equal("Status=Active", log.OldValue);
        Assert.Equal("Status=InMaintenance", log.NewValue);
        Assert.Equal("Scheduled maintenance.", log.Notes);
    }

    [Fact]
    public async Task GetHistoryAsync_filters_by_action()
    {
        await _service.LogAsync(AuditAction.VehicleUpdated, "Vehicle");
        await _service.LogAsync(AuditAction.WorkOrderStatusChanged, "WorkOrder");
        await _service.LogAsync(AuditAction.VehicleUpdated, "Vehicle");

        var results = await _service.GetHistoryAsync(
            new AuditHistoryFilter(AuditAction.VehicleUpdated, null, null, null, null));

        Assert.Equal(2, results.TotalCount);
        Assert.Equal(2, results.Items.Count);
        Assert.Equal(1, results.PageCount);
        Assert.All(results.Items, r => Assert.Equal(AuditAction.VehicleUpdated, r.Action));
    }

    [Fact]
    public async Task GetHistoryAsync_filters_by_entity_id()
    {
        var targetId = Guid.NewGuid();
        var otherId = Guid.NewGuid();

        await _service.LogAsync(AuditAction.VehicleUpdated, "Vehicle", targetId);
        await _service.LogAsync(AuditAction.VehicleUpdated, "Vehicle", otherId);

        var results = await _service.GetHistoryAsync(
            new AuditHistoryFilter(null, targetId, null, null, null));

        Assert.Equal(1, results.TotalCount);
        Assert.Single(results.Items);
        Assert.Equal(targetId, results.Items[0].EntityId);
    }

    [Fact]
    public async Task GetHistoryAsync_filters_by_date_range()
    {
        await _service.LogAsync(AuditAction.UserCreated, "User");

        var results = await _service.GetHistoryAsync(new AuditHistoryFilter(
            null, null, null,
            DateTime.UtcNow.AddMinutes(-1),
            DateTime.UtcNow.AddMinutes(1)));

        Assert.True(results.TotalCount > 0);
        Assert.NotEmpty(results.Items);
    }

    [Fact]
    public async Task GetHistoryAsync_returns_pagination_metadata()
    {
        for (var i = 0; i < 5; i++)
            await _service.LogAsync(AuditAction.VehicleUpdated, "Vehicle");

        var results = await _service.GetHistoryAsync(
            new AuditHistoryFilter(null, null, null, null, null, Page: 1, PageSize: 2));

        Assert.Equal(5, results.TotalCount);
        Assert.Equal(2, results.Items.Count);
        Assert.Equal(1, results.Page);
        Assert.Equal(2, results.PageSize);
        Assert.Equal(3, results.PageCount);
    }

    [Fact]
    public async Task GetByIdAsync_returns_matching_entry()
    {
        await _service.LogAsync(AuditAction.InspectionFailed, "Inspection", notes: "Test entry.");

        var all = await _context.AuditLogs.ToListAsync();
        var id = all[0].Id;

        var entry = await _service.GetByIdAsync(id);

        Assert.NotNull(entry);
        Assert.Equal(AuditAction.InspectionFailed, entry!.Action);
    }

    [Fact]
    public async Task GetByIdAsync_returns_null_for_unknown_id()
    {
        var result = await _service.GetByIdAsync(Guid.NewGuid());

        Assert.Null(result);
    }
}
