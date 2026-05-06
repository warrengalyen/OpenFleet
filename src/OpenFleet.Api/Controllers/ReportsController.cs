using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Services;

namespace OpenFleet.Api.Controllers;

/// <summary>
/// Dashboard and operational reporting endpoints.
/// All endpoints are read-only and available to any authenticated user.
/// </summary>
[ApiController]
[Route("api/reports")]
[Produces("application/json")]
[Authorize(Roles = AuthorizationPolicies.AnyAuthenticated)]
public class ReportsController : ControllerBase
{
    private readonly ReportingService _reportingService;

    public ReportsController(ReportingService reportingService)
    {
        _reportingService = reportingService;
    }

    /// <summary>
    /// Returns all non-completed, non-cancelled work orders grouped by status.
    /// Use this for a live operational view of outstanding maintenance tasks.
    /// </summary>
    [HttpGet("open-work-orders")]
    [ProducesResponseType(typeof(OpenWorkOrdersReport), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOpenWorkOrders(CancellationToken cancellationToken)
        => Ok(await _reportingService.GetOpenWorkOrdersAsync(cancellationToken));

    /// <summary>
    /// Returns vehicles and assets whose maintenance schedules are currently overdue.
    /// Combines date-interval and mileage-interval checks.
    /// </summary>
    [HttpGet("vehicles-due")]
    [ProducesResponseType(typeof(VehiclesDueForServiceReport), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVehiclesDueForService(CancellationToken cancellationToken)
        => Ok(await _reportingService.GetVehiclesDueForServiceAsync(cancellationToken));

    /// <summary>
    /// Summarizes total labor hours and completed work order count per vehicle.
    /// Useful for identifying high-maintenance assets and forecasting service costs.
    /// </summary>
    [HttpGet("maintenance-cost")]
    [ProducesResponseType(typeof(MaintenanceCostReport), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMaintenanceCost(CancellationToken cancellationToken)
        => Ok(await _reportingService.GetMaintenanceCostByVehicleAsync(cancellationToken));

    /// <summary>
    /// Lists all parts with current stock levels and total inventory value.
    /// Total inventory value = sum of (quantity × unit cost) for each part.
    /// </summary>
    [HttpGet("parts-usage")]
    [ProducesResponseType(typeof(PartUsageReport), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPartsUsage(CancellationToken cancellationToken)
        => Ok(await _reportingService.GetPartUsageSummaryAsync(cancellationToken));

    /// <summary>
    /// Lists vehicles currently in maintenance or with open work orders.
    /// Provides a snapshot of fleet availability and active maintenance activity.
    /// </summary>
    [HttpGet("vehicle-downtime")]
    [ProducesResponseType(typeof(VehicleDowntimeReport), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVehicleDowntime(CancellationToken cancellationToken)
        => Ok(await _reportingService.GetVehicleDowntimeAsync(cancellationToken));

    /// <summary>
    /// Returns inspection outcome counts and overall failure rate percentage.
    /// Includes a breakdown of the top vehicles by number of failed inspections.
    /// </summary>
    [HttpGet("inspection-failure-rate")]
    [ProducesResponseType(typeof(InspectionFailureRateReport), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInspectionFailureRate(CancellationToken cancellationToken)
        => Ok(await _reportingService.GetInspectionFailureRateAsync(cancellationToken));

    /// <summary>
    /// Returns total work order counts broken down by status.
    /// Useful for tracking workflow throughput and backlog size.
    /// </summary>
    [HttpGet("work-orders-by-status")]
    [ProducesResponseType(typeof(WorkOrdersByStatusReport), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWorkOrdersByStatus(CancellationToken cancellationToken)
        => Ok(await _reportingService.GetWorkOrdersByStatusAsync(cancellationToken));

    /// <summary>
    /// Returns total work order counts broken down by priority level.
    /// High and Critical counts are key inputs for maintenance staffing decisions.
    /// </summary>
    [HttpGet("work-orders-by-priority")]
    [ProducesResponseType(typeof(WorkOrdersByPriorityReport), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWorkOrdersByPriority(CancellationToken cancellationToken)
        => Ok(await _reportingService.GetWorkOrdersByPriorityAsync(cancellationToken));
}
