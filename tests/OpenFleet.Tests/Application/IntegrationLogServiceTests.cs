using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Services;
using OpenFleet.Domain.Enums;
using OpenFleet.Infrastructure.Persistence;
using OpenFleet.Tests.Helpers;

namespace OpenFleet.Tests.Application;

public class IntegrationLogServiceTests : IDisposable
{
    private readonly OpenFleetDbContext _context;
    private readonly IntegrationLogService _service;

    public IntegrationLogServiceTests()
    {
        var options = new DbContextOptionsBuilder<OpenFleetDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new OpenFleetDbContext(options);
        var auditService = new AuditService(_context);
        var settingsProvider = ApplicationSettingsTestHelper.CreateProviderAsync(_context).GetAwaiter().GetResult();
        _service = new IntegrationLogService(
            _context,
            NullLogger<IntegrationLogService>.Instance,
            auditService,
            settingsProvider);
    }

    public void Dispose() => _context.Dispose();

    [Fact]
    public async Task CreateAsync_creates_pending_log()
    {
        var log = await _service.CreateAsync(IntegrationSource.FuelUsage, IntegrationDirection.Import);

        Assert.NotNull(log);
        Assert.Equal(IntegrationStatus.Pending, log.Status);
        Assert.Equal(IntegrationSource.FuelUsage, log.Source);
        Assert.Equal(IntegrationDirection.Import, log.Direction);
        Assert.Equal(0, log.AttemptCount);
    }

    [Fact]
    public async Task RecordSuccessAsync_sets_status_to_success()
    {
        var log = await _service.CreateAsync(IntegrationSource.PartsSupplier, IntegrationDirection.Import);

        await _service.RecordSuccessAsync(log.Id, "[{\"partId\":\"abc\"}]", 1);

        var updated = await _context.IntegrationLogs.FindAsync(log.Id);
        Assert.NotNull(updated);
        Assert.Equal(IntegrationStatus.Success, updated!.Status);
        Assert.Equal(1, updated.RecordsProcessed);
        Assert.Equal(1, updated.AttemptCount);
        Assert.NotNull(updated.LastAttemptAt);
        Assert.Null(updated.NextRetryAt);
        Assert.Null(updated.ErrorMessage);
    }

    [Fact]
    public async Task RecordFailureAsync_first_attempt_sets_retrying_with_backoff()
    {
        var log = await _service.CreateAsync(IntegrationSource.VendorRepair, IntegrationDirection.Import);

        await _service.RecordFailureAsync(log.Id, "Connection timeout");

        var updated = await _context.IntegrationLogs.FindAsync(log.Id);
        Assert.NotNull(updated);
        Assert.Equal(IntegrationStatus.Retrying, updated!.Status);
        Assert.Equal(1, updated.AttemptCount);
        Assert.NotNull(updated.NextRetryAt);
        Assert.True(updated.NextRetryAt > DateTime.UtcNow);
        Assert.Equal("Connection timeout", updated.ErrorMessage);
    }

    [Fact]
    public async Task RecordFailureAsync_second_attempt_sets_retrying_with_longer_backoff()
    {
        var log = await _service.CreateAsync(IntegrationSource.ExternalAsset, IntegrationDirection.Import);

        await _service.RecordFailureAsync(log.Id, "Attempt 1 error");
        await _service.RecordFailureAsync(log.Id, "Attempt 2 error");

        var updated = await _context.IntegrationLogs.FindAsync(log.Id);
        Assert.NotNull(updated);
        Assert.Equal(IntegrationStatus.Retrying, updated!.Status);
        Assert.Equal(2, updated.AttemptCount);
        // Second backoff is 8 minutes → NextRetryAt should be well in the future
        Assert.True(updated.NextRetryAt > DateTime.UtcNow.AddMinutes(1));
    }

    [Fact]
    public async Task RecordFailureAsync_third_attempt_sets_failed_permanently()
    {
        var log = await _service.CreateAsync(IntegrationSource.FuelUsage, IntegrationDirection.Import);

        await _service.RecordFailureAsync(log.Id, "Error 1");
        await _service.RecordFailureAsync(log.Id, "Error 2");
        await _service.RecordFailureAsync(log.Id, "Error 3 - final");

        var updated = await _context.IntegrationLogs.FindAsync(log.Id);
        Assert.NotNull(updated);
        Assert.Equal(IntegrationStatus.Failed, updated!.Status);
        Assert.Equal(3, updated.AttemptCount);
        Assert.Null(updated.NextRetryAt);
        Assert.Equal("Error 3 - final", updated.ErrorMessage);
    }

    [Fact]
    public async Task GetPendingRetriesAsync_returns_only_due_retries()
    {
        // A retry that is due now
        var dueLog = await _service.CreateAsync(IntegrationSource.FuelUsage, IntegrationDirection.Import);
        await _service.RecordFailureAsync(dueLog.Id, "err");
        // Manually set NextRetryAt to the past
        var entry = await _context.IntegrationLogs.FindAsync(dueLog.Id);
        entry!.NextRetryAt = DateTime.UtcNow.AddMinutes(-5);
        await _context.SaveChangesAsync();

        // A retry not yet due
        var futureLog = await _service.CreateAsync(IntegrationSource.PartsSupplier, IntegrationDirection.Import);
        await _service.RecordFailureAsync(futureLog.Id, "err");

        var due = await _service.GetPendingRetriesAsync(DateTime.UtcNow);

        Assert.Single(due);
        Assert.Equal(dueLog.Id, due[0].Id);
    }

    [Fact]
    public async Task GetHistoryAsync_filters_by_source()
    {
        await _service.CreateAsync(IntegrationSource.FuelUsage, IntegrationDirection.Import);
        await _service.CreateAsync(IntegrationSource.VendorRepair, IntegrationDirection.Import);
        await _service.CreateAsync(IntegrationSource.FuelUsage, IntegrationDirection.Export);

        var filter = new IntegrationHistoryFilter(
            Source: IntegrationSource.FuelUsage,
            Status: null, DateFrom: null, DateTo: null, Page: 1, PageSize: 50);

        var history = await _service.GetHistoryAsync(filter);

        Assert.Equal(2, history.TotalCount);
        Assert.All(history.Items, i => Assert.Equal(IntegrationSource.FuelUsage, i.Source));
    }

    [Fact]
    public async Task GetHistoryAsync_filters_by_status()
    {
        var log1 = await _service.CreateAsync(IntegrationSource.FuelUsage, IntegrationDirection.Import);
        await _service.RecordSuccessAsync(log1.Id, "{}", 1);
        await _service.CreateAsync(IntegrationSource.VendorRepair, IntegrationDirection.Import);

        var filter = new IntegrationHistoryFilter(
            Source: null,
            Status: IntegrationStatus.Success,
            DateFrom: null, DateTo: null, Page: 1, PageSize: 50);

        var history = await _service.GetHistoryAsync(filter);

        Assert.Equal(1, history.TotalCount);
        Assert.All(history.Items, i => Assert.Equal(IntegrationStatus.Success, i.Status));
    }

    [Fact]
    public async Task GetHistoryAsync_paginates_correctly()
    {
        for (var i = 0; i < 5; i++)
            await _service.CreateAsync(IntegrationSource.FuelUsage, IntegrationDirection.Import);

        var filter = new IntegrationHistoryFilter(
            Source: null, Status: null, DateFrom: null, DateTo: null, Page: 1, PageSize: 3);

        var history = await _service.GetHistoryAsync(filter);

        Assert.Equal(5, history.TotalCount);
        Assert.Equal(3, history.Items.Count);
    }
}
