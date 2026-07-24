using OpenFleet.Application.Queries.Reports.Models;

namespace OpenFleet.Application.Queries.Reports;

/// <summary>
/// Read-side queries for dashboard and operational report endpoints.
/// Implementations must be read-only and must not modify data.
/// </summary>
public interface IReportQueries
{
    Task<OpenWorkOrdersReport> GetOpenWorkOrdersAsync(CancellationToken cancellationToken = default);

    Task<VehiclesDueForServiceReport> GetVehiclesDueForServiceAsync(CancellationToken cancellationToken = default);

    Task<MaintenanceCostReport> GetMaintenanceCostByVehicleAsync(CancellationToken cancellationToken = default);

    Task<PartUsageReport> GetPartUsageSummaryAsync(CancellationToken cancellationToken = default);

    Task<VehicleDowntimeReport> GetVehicleDowntimeAsync(CancellationToken cancellationToken = default);

    Task<InspectionFailureRateReport> GetInspectionFailureRateAsync(CancellationToken cancellationToken = default);

    Task<WorkOrdersByStatusReport> GetWorkOrdersByStatusAsync(CancellationToken cancellationToken = default);

    Task<WorkOrdersByPriorityReport> GetWorkOrdersByPriorityAsync(CancellationToken cancellationToken = default);
}
