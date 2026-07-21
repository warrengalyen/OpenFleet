using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Services;

namespace OpenFleet.Infrastructure.BackgroundServices;

public class MaintenanceDueCheckerService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MaintenanceDueCheckerService> _logger;
    private readonly TimeSpan _checkInterval;
    private readonly ConcurrentDictionary<Guid, byte> _alertedScheduleIds = new();

    public MaintenanceDueCheckerService(
        IServiceScopeFactory scopeFactory,
        ILogger<MaintenanceDueCheckerService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _checkInterval = TimeSpan.FromHours(1);
    }

    /// <summary>Exposes alerted IDs for tests.</summary>
    internal ConcurrentDictionary<Guid, byte> AlertedScheduleIds => _alertedScheduleIds;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Maintenance due checker service started. Interval: {Interval}", _checkInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckMaintenanceDueAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error occurred while checking maintenance schedules.");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }
    }

    /// <summary>Runs a single due check (also used by tests).</summary>
    internal Task CheckMaintenanceDueAsync(CancellationToken cancellationToken) =>
        CheckMaintenanceDueCoreAsync(cancellationToken);

    private async Task CheckMaintenanceDueCoreAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IOpenFleetDbContext>();
        var settingsProvider = scope.ServiceProvider.GetRequiredService<IApplicationSettingsProvider>();
        var notificationPublisher = scope.ServiceProvider.GetRequiredService<INotificationPublisher>();

        var now = DateTime.UtcNow;
        var settings = await settingsProvider.GetValuesAsync(cancellationToken);

        var activeSchedules = await context.MaintenanceSchedules
            .Include(s => s.Vehicle)
            .Include(s => s.Asset)
            .Where(s => s.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var dueCount = 0;
        var upcomingCount = 0;
        foreach (var schedule in activeSchedules)
        {
            var currentMileage = schedule.Vehicle?.Mileage;
            if (MaintenanceDueCalculator.IsDue(schedule, now, currentMileage))
            {
                dueCount++;
                LogDueSchedule(schedule, now, currentMileage);

                if (_alertedScheduleIds.TryAdd(schedule.Id, 0))
                {
                    var daysOverdue = MaintenanceDueCalculator.DaysOverdue(schedule, now);
                    var milesOverdue = MaintenanceDueCalculator.MilesOverdue(schedule, currentMileage);
                    var target = schedule.Vehicle is not null
                        ? $"{schedule.Vehicle.Year} {schedule.Vehicle.Make} {schedule.Vehicle.Model}"
                        : schedule.Asset?.Name ?? "Unknown";

                    await notificationPublisher.PublishMaintenanceOverdueAsync(
                        new MaintenanceOverdueNotification(
                            schedule.Id,
                            schedule.Name,
                            target,
                            daysOverdue?.TotalDays,
                            milesOverdue,
                            DateTimeOffset.UtcNow),
                        cancellationToken);
                }

                continue;
            }

            _alertedScheduleIds.TryRemove(schedule.Id, out _);

            if (MaintenanceDueCalculator.IsDueOrWithinLeadDays(
                    schedule, now, settings.MaintenanceReminderLeadDays, currentMileage))
            {
                upcomingCount++;
                var target = schedule.Vehicle is not null
                    ? $"Vehicle '{schedule.Vehicle.Year} {schedule.Vehicle.Make} {schedule.Vehicle.Model}'"
                    : $"Asset '{schedule.Asset?.Name ?? "Unknown"}'";
                _logger.LogInformation(
                    "Schedule '{ScheduleName}' for {Target} is due within {LeadDays} day(s).",
                    schedule.Name, target, settings.MaintenanceReminderLeadDays);
            }
        }

        _logger.LogInformation(
            "Maintenance due check complete. {DueCount} overdue, {UpcomingCount} upcoming within {LeadDays} day(s), {TotalCount} active schedules.",
            dueCount, upcomingCount, settings.MaintenanceReminderLeadDays, activeSchedules.Count);
    }

    private void LogDueSchedule(Domain.Entities.MaintenanceSchedule schedule, DateTime now, int? currentMileage)
    {
        var target = schedule.Vehicle is not null
            ? $"Vehicle '{schedule.Vehicle.Year} {schedule.Vehicle.Make} {schedule.Vehicle.Model}'"
            : $"Asset '{schedule.Asset?.Name ?? "Unknown"}'";

        var daysOverdue = MaintenanceDueCalculator.DaysOverdue(schedule, now);
        var milesOverdue = MaintenanceDueCalculator.MilesOverdue(schedule, currentMileage);

        if (daysOverdue.HasValue && milesOverdue.HasValue)
        {
            _logger.LogWarning(
                "Schedule '{ScheduleName}' for {Target} is overdue by {Days:F0} days and {Miles} miles.",
                schedule.Name, target, daysOverdue.Value.TotalDays, milesOverdue.Value);
        }
        else if (daysOverdue.HasValue)
        {
            _logger.LogWarning(
                "Schedule '{ScheduleName}' for {Target} is overdue by {Days:F0} days.",
                schedule.Name, target, daysOverdue.Value.TotalDays);
        }
        else if (milesOverdue.HasValue)
        {
            _logger.LogWarning(
                "Schedule '{ScheduleName}' for {Target} is overdue by {Miles} miles.",
                schedule.Name, target, milesOverdue.Value);
        }
        else
        {
            _logger.LogInformation(
                "Schedule '{ScheduleName}' for {Target} is due for service.",
                schedule.Name, target);
        }
    }
}
