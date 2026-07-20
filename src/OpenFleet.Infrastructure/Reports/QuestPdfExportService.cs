using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.Interfaces;
using OpenFleet.Application.Reports;
using OpenFleet.Application.Reports.Models;
using OpenFleet.Domain.Services;
using OpenFleet.Infrastructure.Reports.Documents;
using OpenFleet.Infrastructure.Reports.Styling;
using QuestPDF.Fluent;

namespace OpenFleet.Infrastructure.Reports;

public sealed class QuestPdfExportService : IPdfExportService
{
    private static readonly Regex UnsafeFilenameChars = new(@"[^\w\-]+", RegexOptions.Compiled);

    private readonly IOpenFleetDbContext _context;
    private readonly IApplicationSettingsProvider _settingsProvider;

    public QuestPdfExportService(
        IOpenFleetDbContext context,
        IApplicationSettingsProvider settingsProvider)
    {
        _context = context;
        _settingsProvider = settingsProvider;
    }

    public async Task<PdfExportResult?> GenerateWorkOrderAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var workOrder = await _context.WorkOrders
            .AsNoTracking()
            .Where(w => w.Id == id)
            .Select(w => new
            {
                w.Id,
                w.Title,
                w.Description,
                Status = w.Status.ToString(),
                Priority = w.Priority.ToString(),
                VehicleDescription = w.Vehicle == null
                    ? null
                    : $"{w.Vehicle.Year} {w.Vehicle.Make} {w.Vehicle.Model}",
                AssetDescription = w.Asset == null ? null : w.Asset.Name,
                AssignedUserName = w.AssignedUser == null
                    ? null
                    : (w.AssignedUser.FirstName + " " + w.AssignedUser.LastName).Trim(),
                w.LaborHours,
                w.CreatedAt,
                w.DueDate,
                w.CompletedAt,
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (workOrder is null)
            return null;

        var notes = await _context.WorkOrderNotes
            .AsNoTracking()
            .Where(n => n.WorkOrderId == id)
            .OrderByDescending(n => n.CreatedAt)
            .ThenBy(n => n.Id)
            .Select(n => new WorkOrderNotePdfModel(
                ToOffset(n.CreatedAt),
                n.AuthorName,
                n.Content))
            .ToListAsync(cancellationToken);

        var maintenanceRecord = await _context.MaintenanceRecords
            .AsNoTracking()
            .Where(m => m.WorkOrderId == id)
            .Select(m => new
            {
                m.PerformedAt,
                m.OdometerReading,
                m.Notes,
            })
            .FirstOrDefaultAsync(cancellationToken);

        var settings = await _settingsProvider.GetValuesAsync(cancellationToken);
        var generatedAt = DateTimeOffset.UtcNow;

        string? maintenanceSummary = maintenanceRecord is null
            ? null
            : $"Performed {maintenanceRecord.PerformedAt:yyyy-MM-dd} at {maintenanceRecord.OdometerReading:N0} mi"
              + (string.IsNullOrWhiteSpace(maintenanceRecord.Notes)
                  ? string.Empty
                  : $". {maintenanceRecord.Notes}");

        var model = new WorkOrderPdfModel(
            workOrder.Id,
            settings.OrganizationName,
            workOrder.Title,
            workOrder.Description,
            workOrder.Status,
            workOrder.Priority,
            workOrder.VehicleDescription,
            workOrder.AssetDescription,
            workOrder.AssignedUserName,
            workOrder.LaborHours,
            ToOffset(workOrder.CreatedAt),
            workOrder.DueDate is null ? null : ToOffset(workOrder.DueDate.Value),
            workOrder.CompletedAt is null ? null : ToOffset(workOrder.CompletedAt.Value),
            generatedAt,
            notes,
            maintenanceSummary);

        var bytes = new WorkOrderPdfDocument(model, PdfTheme.Default).GeneratePdf();
        var fileName = BuildFileName("work-order", workOrder.Title, workOrder.Id);
        return new PdfExportResult(bytes, fileName);
    }

    public async Task<PdfExportResult?> GenerateVehicleMaintenanceHistoryAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles
            .AsNoTracking()
            .Where(v => v.Id == id)
            .Select(v => new
            {
                v.Id,
                YearMakeModel = $"{v.Year} {v.Make} {v.Model}",
                v.LicensePlate,
                v.VIN,
                v.Mileage,
                Status = v.Status.ToString(),
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (vehicle is null)
            return null;

        var inspections = await _context.Inspections
            .AsNoTracking()
            .Where(i => i.VehicleId == id)
            .Select(i => new
            {
                i.Id,
                i.InspectedAt,
                Status = i.Status.ToString(),
                i.Notes,
            })
            .ToListAsync(cancellationToken);

        var workOrders = await _context.WorkOrders
            .AsNoTracking()
            .Where(w => w.VehicleId == id)
            .Select(w => new
            {
                w.Id,
                w.Title,
                w.CreatedAt,
                Status = w.Status.ToString(),
                w.Description,
            })
            .ToListAsync(cancellationToken);

        var workOrderIds = workOrders.Select(w => w.Id).ToList();

        var maintenanceRecords = await _context.MaintenanceRecords
            .AsNoTracking()
            .Where(m => workOrderIds.Contains(m.WorkOrderId))
            .Select(m => new
            {
                m.Id,
                m.WorkOrderId,
                m.PerformedAt,
                m.OdometerReading,
                m.Notes,
            })
            .ToListAsync(cancellationToken);

        var schedules = await _context.MaintenanceSchedules
            .AsNoTracking()
            .Where(s => s.VehicleId == id && s.IsActive)
            .ToListAsync(cancellationToken);

        var history = new List<MaintenanceTimelinePdfItem>();

        foreach (var inspection in inspections)
        {
            history.Add(new MaintenanceTimelinePdfItem(
                ToOffset(inspection.InspectedAt),
                MaintenanceTimelineItemType.Inspection,
                "Inspection",
                inspection.Status,
                string.IsNullOrWhiteSpace(inspection.Notes) ? null : inspection.Notes,
                inspection.Id.ToString("N")));
        }

        foreach (var workOrder in workOrders)
        {
            history.Add(new MaintenanceTimelinePdfItem(
                ToOffset(workOrder.CreatedAt),
                MaintenanceTimelineItemType.WorkOrder,
                workOrder.Title,
                workOrder.Status,
                string.IsNullOrWhiteSpace(workOrder.Description) ? null : workOrder.Description,
                workOrder.Id.ToString("N")));
        }

        foreach (var record in maintenanceRecords)
        {
            history.Add(new MaintenanceTimelinePdfItem(
                ToOffset(record.PerformedAt),
                MaintenanceTimelineItemType.MaintenanceRecord,
                "Maintenance performed",
                null,
                $"Odometer {record.OdometerReading:N0} mi"
                + (string.IsNullOrWhiteSpace(record.Notes) ? string.Empty : $". {record.Notes}"),
                record.Id.ToString("N")));
        }

        var upcoming = new List<MaintenanceTimelinePdfItem>();
        foreach (var schedule in schedules)
        {
            var nextDue = MaintenanceDueCalculator.NextDueDate(schedule);
            var nextMileage = MaintenanceDueCalculator.NextDueMileage(schedule);
            var date = nextDue ?? schedule.CreatedAt;
            var summaryParts = new List<string>();
            if (nextDue.HasValue)
                summaryParts.Add($"Due {nextDue.Value:yyyy-MM-dd}");
            if (nextMileage.HasValue)
                summaryParts.Add($"Due at {nextMileage.Value:N0} mi");
            if (!string.IsNullOrWhiteSpace(schedule.Description))
                summaryParts.Add(schedule.Description);

            upcoming.Add(new MaintenanceTimelinePdfItem(
                ToOffset(date),
                MaintenanceTimelineItemType.Schedule,
                schedule.Name,
                schedule.IsActive ? "Active" : "Inactive",
                summaryParts.Count == 0 ? null : string.Join(" · ", summaryParts),
                schedule.Id.ToString("N")));
        }

        history = SortTimeline(history);
        upcoming = SortTimeline(upcoming);

        var settings = await _settingsProvider.GetValuesAsync(cancellationToken);
        var model = new VehicleMaintenanceHistoryPdfModel(
            vehicle.Id,
            settings.OrganizationName,
            vehicle.YearMakeModel,
            vehicle.LicensePlate,
            vehicle.VIN,
            vehicle.Mileage,
            vehicle.Status,
            DateTimeOffset.UtcNow,
            history,
            upcoming);

        var bytes = new VehicleMaintenanceHistoryPdfDocument(model, PdfTheme.Default).GeneratePdf();
        var fileName = BuildFileName(
            "vehicle",
            vehicle.LicensePlate,
            vehicle.Id,
            suffix: "maintenance-history");

        return new PdfExportResult(bytes, fileName);
    }

    private static List<MaintenanceTimelinePdfItem> SortTimeline(List<MaintenanceTimelinePdfItem> items) =>
        items
            .OrderByDescending(i => i.Date)
            .ThenBy(i => i.Type)
            .ThenBy(i => i.ReferenceNumber, StringComparer.Ordinal)
            .ToList();

    private static DateTimeOffset ToOffset(DateTime value)
    {
        var utc = value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc),
        };
        return new DateTimeOffset(utc);
    }

    public static string BuildFileName(string prefix, string? preferredSegment, Guid id, string? suffix = null)
    {
        var sanitized = SanitizeFilenameSegment(preferredSegment);
        var core = string.IsNullOrEmpty(sanitized)
            ? $"{prefix}-{id:N}"
            : $"{prefix}-{sanitized}";

        if (!string.IsNullOrEmpty(suffix))
            core = $"{core}-{suffix}";

        return $"{core}.pdf";
    }

    public static string SanitizeFilenameSegment(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var cleaned = UnsafeFilenameChars.Replace(value.Trim(), "-");
        cleaned = cleaned.Trim('-');
        if (cleaned.Length > 80)
            cleaned = cleaned[..80].TrimEnd('-');

        return cleaned;
    }
}
