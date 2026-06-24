using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Services;

namespace OpenFleet.Application.Services;

public class MaintenanceScheduleService
{
    private readonly IOpenFleetDbContext _context;
    private readonly IApplicationSettingsProvider _settingsProvider;

    public MaintenanceScheduleService(
        IOpenFleetDbContext context,
        IApplicationSettingsProvider settingsProvider)
    {
        _context = context;
        _settingsProvider = settingsProvider;
    }

    public async Task<Result<MaintenanceScheduleResponse>> CreateAsync(
        CreateMaintenanceScheduleRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.VehicleId.HasValue)
        {
            var exists = await _context.Vehicles.AnyAsync(v => v.Id == request.VehicleId.Value, cancellationToken);
            if (!exists) return Result<MaintenanceScheduleResponse>.NotFound("Vehicle not found.");
        }

        if (request.AssetId.HasValue)
        {
            var exists = await _context.Assets.AnyAsync(a => a.Id == request.AssetId.Value, cancellationToken);
            if (!exists) return Result<MaintenanceScheduleResponse>.NotFound("Asset not found.");
        }

        var schedule = new MaintenanceSchedule
        {
            Name = request.Name,
            Description = request.Description ?? string.Empty,
            VehicleId = request.VehicleId,
            AssetId = request.AssetId,
            MileageInterval = request.MileageInterval,
            DayInterval = request.DayInterval
        };

        _context.MaintenanceSchedules.Add(schedule);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<MaintenanceScheduleResponse>.Success(
            (await LoadResponseAsync(schedule.Id, null, cancellationToken))!);
    }

    public async Task<Result<MaintenanceScheduleResponse>> UpdateAsync(
        Guid id,
        UpdateMaintenanceScheduleRequest request,
        CancellationToken cancellationToken = default)
    {
        var schedule = await _context.MaintenanceSchedules
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (schedule is null)
            return Result<MaintenanceScheduleResponse>.NotFound($"Maintenance schedule {id} not found.");

        if (request.Name is not null) schedule.Name = request.Name;
        if (request.Description is not null) schedule.Description = request.Description;
        if (request.MileageInterval.HasValue) schedule.MileageInterval = request.MileageInterval;
        if (request.DayInterval.HasValue) schedule.DayInterval = request.DayInterval;
        if (request.IsActive.HasValue) schedule.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<MaintenanceScheduleResponse>.Success(
            (await LoadResponseAsync(id, null, cancellationToken))!);
    }

    public async Task<Result<MaintenanceScheduleResponse>> MarkPerformedAsync(
        Guid id,
        MarkPerformedRequest request,
        CancellationToken cancellationToken = default)
    {
        var schedule = await _context.MaintenanceSchedules
            .Include(s => s.Vehicle)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (schedule is null)
            return Result<MaintenanceScheduleResponse>.NotFound($"Maintenance schedule {id} not found.");

        schedule.LastPerformedAt = request.PerformedAt;
        if (request.Mileage.HasValue) schedule.LastPerformedMileage = request.Mileage;

        await _context.SaveChangesAsync(cancellationToken);

        int? currentMileage = schedule.Vehicle?.Mileage;
        return Result<MaintenanceScheduleResponse>.Success(
            (await LoadResponseAsync(id, currentMileage, cancellationToken))!);
    }

    public async Task<Result<MaintenanceScheduleResponse>> DeactivateAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var schedule = await _context.MaintenanceSchedules
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (schedule is null)
            return Result<MaintenanceScheduleResponse>.NotFound($"Maintenance schedule {id} not found.");

        schedule.IsActive = false;
        await _context.SaveChangesAsync(cancellationToken);

        return Result<MaintenanceScheduleResponse>.Success(
            (await LoadResponseAsync(id, null, cancellationToken))!);
    }

    public async Task<MaintenanceScheduleResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await LoadResponseAsync(id, null, cancellationToken);

    public async Task<IReadOnlyList<MaintenanceScheduleResponse>> GetAllAsync(
        bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var query = _context.MaintenanceSchedules
            .Include(s => s.Vehicle)
            .Include(s => s.Asset)
            .AsNoTracking()
            .AsQueryable();

        if (activeOnly) query = query.Where(s => s.IsActive);

        var schedules = await query.OrderBy(s => s.Name).ToListAsync(cancellationToken);

        return schedules
            .Select(s => BuildResponse(s, s.Vehicle?.Mileage))
            .ToList()
            .AsReadOnly();
    }

    public async Task<IReadOnlyList<VehicleDueForServiceResponse>> GetDueForServiceAsync(
        DateTime now,
        CancellationToken cancellationToken = default)
    {
        var leadDays = (await _settingsProvider.GetValuesAsync(cancellationToken)).MaintenanceReminderLeadDays;

        var activeSchedules = await _context.MaintenanceSchedules
            .Include(s => s.Vehicle)
            .Include(s => s.Asset)
            .Where(s => s.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var dueSchedules = activeSchedules
            .Where(s => MaintenanceDueCalculator.IsDueOrWithinLeadDays(s, now, leadDays, s.Vehicle?.Mileage))
            .ToList();

        // Group by vehicle or asset
        var vehicleGroups = dueSchedules
            .Where(s => s.VehicleId.HasValue)
            .GroupBy(s => s.VehicleId!)
            .Select(g =>
            {
                var vehicle = g.First().Vehicle;
                var currentMileage = vehicle?.Mileage;
                return new VehicleDueForServiceResponse(
                    g.Key,
                    vehicle is null ? null : $"{vehicle.Year} {vehicle.Make} {vehicle.Model}",
                    null,
                    null,
                    currentMileage,
                    g.Select(s => BuildDueEntry(s, now, currentMileage)).ToArray()
                );
            });

        var assetGroups = dueSchedules
            .Where(s => s.AssetId.HasValue && !s.VehicleId.HasValue)
            .GroupBy(s => s.AssetId!)
            .Select(g =>
            {
                var asset = g.First().Asset;
                return new VehicleDueForServiceResponse(
                    null,
                    null,
                    g.Key,
                    asset?.Name,
                    null,
                    g.Select(s => BuildDueEntry(s, now, null)).ToArray()
                );
            });

        return vehicleGroups.Concat(assetGroups).ToList().AsReadOnly();
    }

    private async Task<MaintenanceScheduleResponse?> LoadResponseAsync(
        Guid id,
        int? currentMileage,
        CancellationToken ct)
    {
        var s = await _context.MaintenanceSchedules
            .Include(x => x.Vehicle)
            .Include(x => x.Asset)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (s is null) return null;
        return BuildResponse(s, currentMileage ?? s.Vehicle?.Mileage);
    }

    private static MaintenanceScheduleResponse BuildResponse(
        Domain.Entities.MaintenanceSchedule s,
        int? currentMileage)
    {
        var isDue = MaintenanceDueCalculator.IsDue(s, DateTime.UtcNow, currentMileage);
        var daysOverdue = MaintenanceDueCalculator.DaysOverdue(s, DateTime.UtcNow);
        var milesOverdue = MaintenanceDueCalculator.MilesOverdue(s, currentMileage);

        return new MaintenanceScheduleResponse(
            s.Id,
            s.Name,
            s.Description,
            s.VehicleId,
            s.Vehicle is null ? null : $"{s.Vehicle.Year} {s.Vehicle.Make} {s.Vehicle.Model}",
            s.AssetId,
            s.Asset?.Name,
            s.MileageInterval,
            s.DayInterval,
            s.LastPerformedAt,
            s.LastPerformedMileage,
            s.IsActive,
            isDue,
            MaintenanceDueCalculator.NextDueDate(s),
            MaintenanceDueCalculator.NextDueMileage(s),
            daysOverdue?.TotalDays,
            milesOverdue,
            s.CreatedAt
        );
    }

    private static DueScheduleEntry BuildDueEntry(
        Domain.Entities.MaintenanceSchedule s,
        DateTime now,
        int? currentMileage)
    {
        var nextDueDate = MaintenanceDueCalculator.NextDueDate(s);
        var nextDueMileage = MaintenanceDueCalculator.NextDueMileage(s);
        var daysOverdue = MaintenanceDueCalculator.DaysOverdue(s, now);
        var milesOverdue = MaintenanceDueCalculator.MilesOverdue(s, currentMileage);

        bool? isDueByDate = s.DayInterval.HasValue
            ? nextDueDate.HasValue && now >= nextDueDate.Value
            : null;
        bool? isDueByMileage = s.MileageInterval.HasValue && currentMileage.HasValue
            ? currentMileage.Value >= (nextDueMileage ?? 0)
            : null;

        return new DueScheduleEntry(
            s.Id,
            s.Name,
            isDueByDate,
            isDueByMileage,
            nextDueDate,
            nextDueMileage,
            daysOverdue?.TotalDays,
            milesOverdue
        );
    }
}
