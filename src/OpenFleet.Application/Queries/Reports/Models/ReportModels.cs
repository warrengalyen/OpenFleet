using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.Queries.Reports.Models;

// ── Open work orders ──────────────────────────────────────────────────────────

public record OpenWorkOrdersReport(
    int TotalOpen,
    int Open,
    int InProgress,
    int WaitingForParts,
    IReadOnlyList<WorkOrderSummaryItem> Items
);

public record WorkOrderSummaryItem(
    Guid Id,
    string Title,
    WorkOrderStatus Status,
    WorkOrderPriority Priority,
    string? VehicleLabel,
    DateTime CreatedAt
);

// ── Vehicles due for service ──────────────────────────────────────────────────

public record VehiclesDueForServiceReport(
    int TotalDue,
    IReadOnlyList<VehicleDueForServiceItem> Vehicles
);

public record VehicleDueForServiceItem(
    Guid? VehicleId,
    string? VehicleDescription,
    Guid? AssetId,
    string? AssetDescription,
    int? CurrentMileage,
    DueScheduleItem[] DueSchedules
);

public record DueScheduleItem(
    Guid ScheduleId,
    string ScheduleName,
    bool? IsDueByDate,
    bool? IsDueByMileage,
    DateTime? NextDueDate,
    int? NextDueMileage,
    double? DaysOverdue,
    int? MilesOverdue
);

// ── Maintenance cost by vehicle ────────────────────────────────────────────────

public record MaintenanceCostByVehicle(
    Guid VehicleId,
    string VehicleLabel,
    decimal TotalLaborHours,
    int CompletedWorkOrders
);

public record MaintenanceCostReport(
    IReadOnlyList<MaintenanceCostByVehicle> Vehicles
);

// ── Parts usage / inventory summary ───────────────────────────────────────────

public record PartUsageSummary(
    Guid PartId,
    string Name,
    string PartNumber,
    string? VendorName,
    int QuantityOnHand,
    decimal UnitCost,
    decimal TotalValue
);

public record PartUsageReport(
    int TotalParts,
    decimal TotalInventoryValue,
    int LowStockThreshold,
    IReadOnlyList<PartUsageSummary> Parts
);

// ── Vehicle downtime ──────────────────────────────────────────────────────────

public record VehicleDowntimeEntry(
    Guid VehicleId,
    string VehicleLabel,
    string LicensePlate,
    VehicleStatus Status,
    int OpenWorkOrderCount,
    DateTime? LastMaintenanceAt
);

public record VehicleDowntimeReport(
    int VehiclesInMaintenance,
    IReadOnlyList<VehicleDowntimeEntry> Vehicles
);

// ── Inspection failure rate ────────────────────────────────────────────────────

public record InspectionFailureBySeverity(
    Guid? VehicleId,
    string? VehicleLabel,
    int FailedCount
);

public record InspectionFailureRateReport(
    int TotalInspections,
    int Passed,
    int Failed,
    int NeedsReview,
    double FailureRatePercent,
    IReadOnlyList<InspectionFailureBySeverity> TopFailedVehicles
);

// ── Work orders by status ─────────────────────────────────────────────────────

public record WorkOrdersByStatusReport(
    int Open,
    int InProgress,
    int WaitingForParts,
    int Completed,
    int Cancelled,
    int Total
);

// ── Work orders by priority ───────────────────────────────────────────────────

public record WorkOrdersByPriorityReport(
    int Low,
    int Medium,
    int High,
    int Critical,
    int Total
);
