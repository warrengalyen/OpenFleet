using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Services;

namespace OpenFleet.Infrastructure.BackgroundServices;

public class MaintenanceDueCheckerService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MaintenanceDueCheckerService> _logger;
    private readonly TimeSpan _checkInterval;

    public MaintenanceDueCheckerService(
        IServiceScopeFactory scopeFactory,
        ILogger<MaintenanceDueCheckerService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _checkInterval = TimeSpan.FromHours(1);
    }

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

    private async Task CheckMaintenanceDueAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IOpenFleetDbContext>();

        var now = DateTime.UtcNow;

        var activeSchedules = await context.MaintenanceSchedules
            .Include(s => s.Vehicle)
            .Include(s => s.Asset)
            .Where(s => s.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var dueCount = 0;
        foreach (var schedule in activeSchedules)
        {
            var currentMileage = schedule.Vehicle?.Mileage;
            if (!MaintenanceDueCalculator.IsDue(schedule, now, currentMileage)) continue;

            dueCount++;
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

        _logger.LogInformation(
            "Maintenance due check complete. {DueCount}/{TotalCount} schedules are due.",
            dueCount, activeSchedules.Count);
    }
}
