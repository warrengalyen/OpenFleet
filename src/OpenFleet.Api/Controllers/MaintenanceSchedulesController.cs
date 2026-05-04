using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Services;

namespace OpenFleet.Api.Controllers;

[ApiController]
[Route("api/maintenance-schedules")]
[Produces("application/json")]
[Authorize(Roles = AuthorizationPolicies.AnyAuthenticated)]
public class MaintenanceSchedulesController : ControllerBase
{
    private readonly MaintenanceScheduleService _scheduleService;

    public MaintenanceSchedulesController(MaintenanceScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    /// <summary>List all active maintenance schedules.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<MaintenanceScheduleResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var results = await _scheduleService.GetAllAsync(activeOnly, cancellationToken);
        return Ok(results);
    }

    /// <summary>Get vehicles and assets currently due for service.</summary>
    [HttpGet("due")]
    [ProducesResponseType(typeof(IEnumerable<VehicleDueForServiceResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDueForService(CancellationToken cancellationToken)
    {
        var results = await _scheduleService.GetDueForServiceAsync(DateTime.UtcNow, cancellationToken);
        return Ok(results);
    }

    /// <summary>Get a single maintenance schedule by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(MaintenanceScheduleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _scheduleService.GetByIdAsync(id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Create a new maintenance schedule.</summary>
    [HttpPost]
    [Authorize(Roles = AuthorizationPolicies.FleetManagerOrAbove)]
    [ProducesResponseType(typeof(MaintenanceScheduleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateMaintenanceScheduleRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _scheduleService.CreateAsync(request, cancellationToken);

        if (!result.IsSuccess)
            return ToErrorResponse(result);

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    /// <summary>Update an existing maintenance schedule.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = AuthorizationPolicies.FleetManagerOrAbove)]
    [ProducesResponseType(typeof(MaintenanceScheduleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateMaintenanceScheduleRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _scheduleService.UpdateAsync(id, request, cancellationToken);

        if (!result.IsSuccess)
            return ToErrorResponse(result);

        return Ok(result.Value);
    }

    /// <summary>Deactivate a maintenance schedule (soft delete).</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AuthorizationPolicies.FleetManagerOrAbove)]
    [ProducesResponseType(typeof(MaintenanceScheduleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken)
    {
        var result = await _scheduleService.DeactivateAsync(id, cancellationToken);

        if (!result.IsSuccess)
            return ToErrorResponse(result);

        return Ok(result.Value);
    }

    /// <summary>Mark a maintenance schedule as performed, updating the last performed date and mileage.</summary>
    [HttpPut("{id:guid}/mark-performed")]
    [Authorize(Roles = AuthorizationPolicies.FleetManagerOrAbove)]
    [ProducesResponseType(typeof(MaintenanceScheduleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkPerformed(
        Guid id,
        [FromBody] MarkPerformedRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _scheduleService.MarkPerformedAsync(id, request, cancellationToken);

        if (!result.IsSuccess)
            return ToErrorResponse(result);

        return Ok(result.Value);
    }

    private IActionResult ToErrorResponse<T>(Result<T> result)
    {
        return result.Code switch
        {
            ErrorCode.NotFound => NotFound(new { message = result.Error }),
            ErrorCode.Conflict => Conflict(new { message = result.Error }),
            ErrorCode.Validation => BadRequest(new { message = result.Error }),
            _ => BadRequest(new { message = result.Error })
        };
    }
}
