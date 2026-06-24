using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Enums;
using OpenFleet.Domain.Services;

namespace OpenFleet.Application.Services;

/// <summary>
/// Provides efficient EF Core queries for all dashboard and operational report endpoints.
/// All methods are read-only (AsNoTracking) and should not modify any data.
/// </summary>
public class ReportingService
{
    private readonly IOpenFleetDbContext _context;
    private readonly IApplicationSettingsProvider _settingsProvider;

    public ReportingService(IOpenFleetDbContext context, IApplicationSettingsProvider settingsProvider)
    {
        _context = context;
        _settingsProvider = settingsProvider;
    }

    // ── 1. Open work orders ────────────────────────────────────────────────────

    public async Task<OpenWorkOrdersReport> GetOpenWorkOrdersAsync(
        CancellationToken cancellationToken = default)
    {
        var items = await _context.WorkOrders
            .AsNoTracking()
            .Where(wo => wo.Status != WorkOrderStatus.Completed
                      && wo.Status != WorkOrderStatus.Cancelled)
            .Include(wo => wo.Vehicle)
            .OrderBy(wo => wo.Priority)
            .ThenBy(wo => wo.CreatedAt)
            .Select(wo => new WorkOrderSummaryItem(
                wo.Id,
                wo.Title,
                wo.Status,
                wo.Priority,
                wo.Vehicle != null
                    ? $"{wo.Vehicle.Year} {wo.Vehicle.Make} {wo.Vehicle.Model}"
                    : null,
                wo.CreatedAt))
            .ToListAsync(cancellationToken);

        return new OpenWorkOrdersReport(
            TotalOpen: items.Count,
            Open: items.Count(i => i.Status == WorkOrderStatus.Open),
            InProgress: items.Count(i => i.Status == WorkOrderStatus.InProgress),
            WaitingForParts: items.Count(i => i.Status == WorkOrderStatus.WaitingForParts),
            Items: items
        );
    }

    // ── 2. Vehicles due for service ────────────────────────────────────────────

    public async Task<VehiclesDueForServiceReport> GetVehiclesDueForServiceAsync(
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var leadDays = (await _settingsProvider.GetValuesAsync(cancellationToken)).MaintenanceReminderLeadDays;

        var schedules = await _context.MaintenanceSchedules
            .AsNoTracking()
            .Where(s => s.IsActive)
            .Include(s => s.Vehicle)
            .Include(s => s.Asset)
            .ToListAsync(cancellationToken);

        // Group schedules by vehicle/asset and check each one
        var dueByVehicle = schedules
            .Where(s => MaintenanceDueCalculator.IsDueOrWithinLeadDays(s, now, leadDays, s.Vehicle?.Mileage))
            .GroupBy(s => new { s.VehicleId, s.AssetId })
            .Select(g =>
            {
                var first = g.First();
                var vehicle = first.Vehicle;
                var asset = first.Asset;

                var dueSchedules = g.Select(s => new DueScheduleEntry(
                    s.Id,
                    s.Name,
                    s.DayInterval.HasValue ? MaintenanceDueCalculator.IsDue(s, now, null) : null,
                    s.MileageInterval.HasValue ? MaintenanceDueCalculator.IsDue(s, now, vehicle?.Mileage) : null,
                    MaintenanceDueCalculator.NextDueDate(s),
                    MaintenanceDueCalculator.NextDueMileage(s),
                    MaintenanceDueCalculator.DaysOverdue(s, now)?.TotalDays,
                    MaintenanceDueCalculator.MilesOverdue(s, vehicle?.Mileage)
                )).ToArray();

                return new VehicleDueForServiceResponse(
                    g.Key.VehicleId,
                    vehicle != null ? $"{vehicle.Year} {vehicle.Make} {vehicle.Model}" : null,
                    g.Key.AssetId,
                    asset?.Name,
                    vehicle?.Mileage,
                    dueSchedules
                );
            })
            .ToList();

        return new VehiclesDueForServiceReport(
            TotalDue: dueByVehicle.Count,
            Vehicles: dueByVehicle
        );
    }

    // ── 3. Maintenance cost by vehicle ─────────────────────────────────────────

    public async Task<MaintenanceCostReport> GetMaintenanceCostByVehicleAsync(
        CancellationToken cancellationToken = default)
    {
        // Materialize first, then order — GroupBy + computed projections aren't fully
        // translatable to SQL when used with subsequent OrderByDescending on EF Core 8.
        var raw = await _context.WorkOrders
            .AsNoTracking()
            .Where(wo => wo.Status == WorkOrderStatus.Completed && wo.VehicleId != null)
            .Include(wo => wo.Vehicle)
            .GroupBy(wo => new { wo.VehicleId, wo.Vehicle!.Make, wo.Vehicle.Model, wo.Vehicle.Year })
            .Select(g => new
            {
                VehicleId = g.Key.VehicleId!.Value,
                Label = $"{g.Key.Year} {g.Key.Make} {g.Key.Model}",
                LaborHours = g.Sum(wo => wo.LaborHours),
                Count = g.Count()
            })
            .ToListAsync(cancellationToken);

        var results = raw
            .OrderByDescending(v => v.LaborHours)
            .Select(v => new MaintenanceCostByVehicle(v.VehicleId, v.Label, v.LaborHours, v.Count))
            .ToList();

        return new MaintenanceCostReport(Vehicles: results);
    }

    // ── 4. Parts usage / inventory summary ────────────────────────────────────

    public async Task<PartUsageReport> GetPartUsageSummaryAsync(
        CancellationToken cancellationToken = default)
    {
        var lowStockThreshold = (await _settingsProvider.GetValuesAsync(cancellationToken)).LowPartsStockThreshold;

        var parts = await _context.Parts
            .AsNoTracking()
            .Include(p => p.Vendor)
            .OrderByDescending(p => (decimal)p.QuantityOnHand * p.UnitCost)
            .Select(p => new PartUsageSummary(
                p.Id,
                p.Name,
                p.PartNumber,
                p.Vendor != null ? p.Vendor.Name : null,
                p.QuantityOnHand,
                p.UnitCost,
                (decimal)p.QuantityOnHand * p.UnitCost
            ))
            .ToListAsync(cancellationToken);

        var totalValue = parts.Sum(p => p.TotalValue);

        return new PartUsageReport(
            TotalParts: parts.Count,
            TotalInventoryValue: totalValue,
            LowStockThreshold: lowStockThreshold,
            Parts: parts
        );
    }

    // ── 5. Vehicle downtime ────────────────────────────────────────────────────

    public async Task<VehicleDowntimeReport> GetVehicleDowntimeAsync(
        CancellationToken cancellationToken = default)
    {
        var vehicles = await _context.Vehicles
            .AsNoTracking()
            .Include(v => v.WorkOrders)
                .ThenInclude(wo => wo.MaintenanceRecord)
            .Where(v => v.Status == VehicleStatus.InMaintenance
                     || v.WorkOrders.Any(wo =>
                            wo.Status == WorkOrderStatus.InProgress
                         || wo.Status == WorkOrderStatus.WaitingForParts))
            .ToListAsync(cancellationToken);

        var entries = vehicles.Select(v =>
        {
            var openWorkOrders = v.WorkOrders.Count(wo =>
                wo.Status == WorkOrderStatus.Open
             || wo.Status == WorkOrderStatus.InProgress
             || wo.Status == WorkOrderStatus.WaitingForParts);

            var lastMaintenance = v.WorkOrders
                .Where(wo => wo.MaintenanceRecord != null)
                .Select(wo => wo.MaintenanceRecord!.PerformedAt)
                .OrderByDescending(d => d)
                .FirstOrDefault();

            return new VehicleDowntimeEntry(
                v.Id,
                $"{v.Year} {v.Make} {v.Model}",
                v.LicensePlate,
                v.Status,
                openWorkOrders,
                lastMaintenance == default ? null : lastMaintenance
            );
        })
        .OrderBy(e => e.VehicleLabel)
        .ToList();

        return new VehicleDowntimeReport(
            VehiclesInMaintenance: entries.Count(e => e.Status == VehicleStatus.InMaintenance),
            Vehicles: entries
        );
    }

    // ── 6. Inspection failure rate ─────────────────────────────────────────────

    public async Task<InspectionFailureRateReport> GetInspectionFailureRateAsync(
        CancellationToken cancellationToken = default)
    {
        var counts = await _context.Inspections
            .AsNoTracking()
            .GroupBy(i => i.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        int total = counts.Sum(c => c.Count);
        int passed = counts.FirstOrDefault(c => c.Status == InspectionStatus.Passed)?.Count ?? 0;
        int failed = counts.FirstOrDefault(c => c.Status == InspectionStatus.Failed)?.Count ?? 0;
        int needsReview = counts.FirstOrDefault(c => c.Status == InspectionStatus.NeedsReview)?.Count ?? 0;

        double failureRate = total == 0 ? 0.0 : Math.Round((double)failed / total * 100, 1);

        // Top vehicles by failed inspection count — materialize before ordering
        // because computed projections on GroupBy aren't always translateable.
        var topFailedRaw = await _context.Inspections
            .AsNoTracking()
            .Where(i => i.Status == InspectionStatus.Failed)
            .Include(i => i.Vehicle)
            .GroupBy(i => new { i.VehicleId, VehicleLabel = i.Vehicle != null
                ? i.Vehicle.Make + " " + i.Vehicle.Model : null })
            .Select(g => new { g.Key.VehicleId, g.Key.VehicleLabel, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var topFailed = topFailedRaw
            .OrderByDescending(x => x.Count)
            .Take(5)
            .Select(x => new InspectionFailureBySeverity(x.VehicleId, x.VehicleLabel, x.Count))
            .ToList();

        return new InspectionFailureRateReport(
            TotalInspections: total,
            Passed: passed,
            Failed: failed,
            NeedsReview: needsReview,
            FailureRatePercent: failureRate,
            TopFailedVehicles: topFailed
        );
    }

    // ── 7. Work orders by status ───────────────────────────────────────────────

    public async Task<WorkOrdersByStatusReport> GetWorkOrdersByStatusAsync(
        CancellationToken cancellationToken = default)
    {
        var counts = await _context.WorkOrders
            .AsNoTracking()
            .GroupBy(wo => wo.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        int Get(WorkOrderStatus s) => counts.FirstOrDefault(c => c.Status == s)?.Count ?? 0;

        int open = Get(WorkOrderStatus.Open);
        int inProgress = Get(WorkOrderStatus.InProgress);
        int waiting = Get(WorkOrderStatus.WaitingForParts);
        int completed = Get(WorkOrderStatus.Completed);
        int cancelled = Get(WorkOrderStatus.Cancelled);

        return new WorkOrdersByStatusReport(
            Open: open,
            InProgress: inProgress,
            WaitingForParts: waiting,
            Completed: completed,
            Cancelled: cancelled,
            Total: open + inProgress + waiting + completed + cancelled
        );
    }

    // ── 8. Work orders by priority ─────────────────────────────────────────────

    public async Task<WorkOrdersByPriorityReport> GetWorkOrdersByPriorityAsync(
        CancellationToken cancellationToken = default)
    {
        var counts = await _context.WorkOrders
            .AsNoTracking()
            .GroupBy(wo => wo.Priority)
            .Select(g => new { Priority = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        int Get(WorkOrderPriority p) => counts.FirstOrDefault(c => c.Priority == p)?.Count ?? 0;

        int low = Get(WorkOrderPriority.Low);
        int medium = Get(WorkOrderPriority.Medium);
        int high = Get(WorkOrderPriority.High);
        int critical = Get(WorkOrderPriority.Critical);

        return new WorkOrdersByPriorityReport(
            Low: low,
            Medium: medium,
            High: high,
            Critical: critical,
            Total: low + medium + high + critical
        );
    }
}
