using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;
using OpenFleet.Infrastructure.BackgroundServices;
using OpenFleet.Infrastructure.Persistence;
using OpenFleet.Tests.Helpers;

namespace OpenFleet.Tests.Infrastructure;

public class MaintenanceDueCheckerNotificationTests : IDisposable
{
    private readonly ServiceProvider _provider;
    private readonly OpenFleetDbContext _context;
    private readonly FakeNotificationPublisher _publisher;
    private readonly MaintenanceDueCheckerService _checker;
    private readonly Guid _scheduleId = Guid.NewGuid();
    private readonly Guid _deptId = Guid.NewGuid();
    private readonly Guid _vehicleId = Guid.NewGuid();

    public MaintenanceDueCheckerNotificationTests()
    {
        var options = new DbContextOptionsBuilder<OpenFleetDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new OpenFleetDbContext(options);
        _publisher = new FakeNotificationPublisher();

        var settingsProvider = ApplicationSettingsTestHelper.CreateProviderAsync(_context).GetAwaiter().GetResult();
        var services = new ServiceCollection();
        services.AddSingleton<IOpenFleetDbContext>(_context);
        services.AddSingleton<INotificationPublisher>(_publisher);
        services.AddSingleton<IApplicationSettingsProvider>(settingsProvider);
        _provider = services.BuildServiceProvider();

        var scopeFactory = _provider.GetRequiredService<IServiceScopeFactory>();
        _checker = new MaintenanceDueCheckerService(
            scopeFactory,
            NullLogger<MaintenanceDueCheckerService>.Instance);

        SeedOverdueSchedule();
    }

    public void Dispose()
    {
        _provider.Dispose();
        _context.Dispose();
    }

    private void SeedOverdueSchedule()
    {
        _context.Departments.Add(new Department { Id = _deptId, Name = "Ops", Code = "OPS" });
        _context.Vehicles.Add(new Vehicle
        {
            Id = _vehicleId,
            VIN = "DUE1234567890123A",
            LicensePlate = "DUE-001",
            Make = "Chevy",
            Model = "Express",
            Year = 2020,
            Mileage = 50000,
            Status = VehicleStatus.Active,
            DepartmentId = _deptId,
        });
        _context.MaintenanceSchedules.Add(new MaintenanceSchedule
        {
            Id = _scheduleId,
            Name = "Oil change",
            Description = "Every 90 days",
            VehicleId = _vehicleId,
            DayInterval = 90,
            IsActive = true,
            LastPerformedAt = DateTime.UtcNow.AddDays(-120),
        });
        _context.SaveChanges();
    }

    [Fact]
    public async Task Check_publishes_once_for_newly_overdue_schedule()
    {
        await _checker.CheckMaintenanceDueAsync(CancellationToken.None);
        Assert.Single(_publisher.MaintenanceOverdueAlerts);
        Assert.Equal(_scheduleId, _publisher.MaintenanceOverdueAlerts[0].ScheduleId);
        Assert.Equal("Oil change", _publisher.MaintenanceOverdueAlerts[0].ScheduleName);
        Assert.True(_checker.AlertedScheduleIds.ContainsKey(_scheduleId));

        await _checker.CheckMaintenanceDueAsync(CancellationToken.None);
        Assert.Single(_publisher.MaintenanceOverdueAlerts);
    }

    [Fact]
    public async Task Check_republishes_after_schedule_cleared_then_due_again()
    {
        await _checker.CheckMaintenanceDueAsync(CancellationToken.None);
        Assert.Single(_publisher.MaintenanceOverdueAlerts);

        var schedule = await _context.MaintenanceSchedules.FindAsync(_scheduleId);
        Assert.NotNull(schedule);
        schedule!.LastPerformedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _checker.CheckMaintenanceDueAsync(CancellationToken.None);
        Assert.False(_checker.AlertedScheduleIds.ContainsKey(_scheduleId));
        Assert.Single(_publisher.MaintenanceOverdueAlerts);

        schedule.LastPerformedAt = DateTime.UtcNow.AddDays(-200);
        await _context.SaveChangesAsync();

        await _checker.CheckMaintenanceDueAsync(CancellationToken.None);
        Assert.Equal(2, _publisher.MaintenanceOverdueAlerts.Count);
        Assert.True(_checker.AlertedScheduleIds.ContainsKey(_scheduleId));
    }
}
