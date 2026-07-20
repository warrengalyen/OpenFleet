using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;
using OpenFleet.Application.Reports;
using OpenFleet.Application.Services;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = AuthorizationPolicies.AnyAuthenticated)]
public class WorkOrdersController : ControllerBase
{
    private readonly WorkOrderService _service;
    private readonly IOpenFleetDbContext _context;
    private readonly IPdfExportService _pdfExportService;
    private readonly ILogger<WorkOrdersController> _logger;

    public WorkOrdersController(
        WorkOrderService service,
        IOpenFleetDbContext context,
        IPdfExportService pdfExportService,
        ILogger<WorkOrdersController> logger)
    {
        _service = service;
        _context = context;
        _pdfExportService = pdfExportService;
        _logger = logger;
    }

    /// <summary>Returns all work orders with optional filtering.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<WorkOrderResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] WorkOrderStatus? status,
        [FromQuery] WorkOrderPriority? priority,
        [FromQuery] Guid? vehicleId,
        [FromQuery] Guid? assetId,
        [FromQuery] Guid? assignedUserId,
        CancellationToken cancellationToken)
    {
        var query = _context.WorkOrders
            .Include(w => w.Vehicle)
            .Include(w => w.Asset)
            .Include(w => w.AssignedUser)
            .Include(w => w.MaintenanceRecord)
            .Include(w => w.Notes)
            .AsNoTracking()
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(w => w.Status == status.Value);

        if (priority.HasValue)
            query = query.Where(w => w.Priority == priority.Value);

        if (vehicleId.HasValue)
            query = query.Where(w => w.VehicleId == vehicleId.Value);

        if (assetId.HasValue)
            query = query.Where(w => w.AssetId == assetId.Value);

        if (assignedUserId.HasValue)
            query = query.Where(w => w.AssignedUserId == assignedUserId.Value);

        var results = await query
            .OrderByDescending(w => w.Priority)
            .ThenBy(w => w.CreatedAt)
            .Select(w => WorkOrderService.ToResponse(w))
            .ToListAsync(cancellationToken);

        return Ok(results);
    }

    /// <summary>Returns a work order by ID with full detail including notes.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(WorkOrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var workOrder = await _context.WorkOrders
            .Include(w => w.Vehicle)
            .Include(w => w.Asset)
            .Include(w => w.AssignedUser)
            .Include(w => w.MaintenanceRecord)
            .Include(w => w.Notes)
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);

        if (workOrder is null)
            return NotFound();

        return Ok(WorkOrderService.ToResponse(workOrder));
    }

    /// <summary>Downloads a PDF of the work order detail.</summary>
    [HttpGet("{id:guid}/pdf")]
    [Produces("application/pdf")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPdf(Guid id, CancellationToken cancellationToken)
    {
        var result = await _pdfExportService.GenerateWorkOrderAsync(id, cancellationToken);
        if (result is null)
            return NotFound();

        return File(result.Content, result.ContentType, result.FileName);
    }

    /// <summary>Creates a new work order.</summary>
    [HttpPost]
    [Authorize(Roles = AuthorizationPolicies.TechnicianOrAbove)]
    [ProducesResponseType(typeof(WorkOrderResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateWorkOrderRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _service.CreateAsync(request, cancellationToken);
        if (!result.IsSuccess)
            return ToErrorResponse(result.Error!, result.Code);

        _logger.LogInformation("Work order created: {Id}", result.Value!.Id);
        return CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value);
    }

    /// <summary>Updates a work order's fields.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = AuthorizationPolicies.TechnicianOrAbove)]
    [ProducesResponseType(typeof(WorkOrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateWorkOrderRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _service.UpdateAsync(id, request, cancellationToken);
        if (!result.IsSuccess)
            return ToErrorResponse(result.Error!, result.Code);

        return Ok(result.Value);
    }

    /// <summary>Soft-cancels a work order by transitioning it to Cancelled.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AuthorizationPolicies.TechnicianOrAbove)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _service.CancelAsync(id, cancellationToken: cancellationToken);
        if (!result.IsSuccess)
            return ToErrorResponse(result.Error!, result.Code);

        _logger.LogInformation("Work order cancelled: {Id}", id);
        return NoContent();
    }

    /// <summary>Transitions a work order to a new status. Returns 409 if the transition is not allowed.</summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = AuthorizationPolicies.TechnicianOrAbove)]
    [ProducesResponseType(typeof(WorkOrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> TransitionStatus(
        Guid id,
        [FromBody] TransitionStatusRequest request,
        CancellationToken cancellationToken)
    {
        var changedBy = User.FindFirstValue(ClaimTypes.Email);
        var result = await _service.TransitionStatusAsync(id, request.NewStatus, changedBy, cancellationToken);
        if (!result.IsSuccess)
            return ToErrorResponse(result.Error!, result.Code);

        return Ok(result.Value);
    }

    /// <summary>Returns all notes for a work order.</summary>
    [HttpGet("{id:guid}/notes")]
    [ProducesResponseType(typeof(IEnumerable<WorkOrderNoteResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetNotes(Guid id, CancellationToken cancellationToken)
    {
        var exists = await _context.WorkOrders.AnyAsync(w => w.Id == id, cancellationToken);
        if (!exists) return NotFound();

        var notes = await _context.WorkOrderNotes
            .Where(n => n.WorkOrderId == id)
            .AsNoTracking()
            .OrderBy(n => n.CreatedAt)
            .Select(n => new WorkOrderNoteResponse(n.Id, n.WorkOrderId, n.Content, n.AuthorName, n.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(notes);
    }

    /// <summary>Adds a note to a work order.</summary>
    [HttpPost("{id:guid}/notes")]
    [ProducesResponseType(typeof(WorkOrderNoteResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddNote(
        Guid id,
        [FromBody] AddNoteRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _service.AddNoteAsync(id, request, cancellationToken);
        if (!result.IsSuccess)
            return ToErrorResponse(result.Error!, result.Code);

        return CreatedAtAction(nameof(GetNotes), new { id }, result.Value);
    }

    /// <summary>Records additional labor hours against a work order.</summary>
    [HttpPut("{id:guid}/labor")]
    [Authorize(Roles = AuthorizationPolicies.TechnicianOrAbove)]
    [ProducesResponseType(typeof(WorkOrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecordLabor(
        Guid id,
        [FromBody] RecordLaborRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _service.RecordLaborAsync(id, request, cancellationToken);
        if (!result.IsSuccess)
            return ToErrorResponse(result.Error!, result.Code);

        return Ok(result.Value);
    }

    /// <summary>Links a maintenance record to a Completed work order. Returns 409 if already linked, 422 if not Completed.</summary>
    [HttpPost("{id:guid}/maintenance-record")]
    [ProducesResponseType(typeof(MaintenanceRecordResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> LinkMaintenanceRecord(
        Guid id,
        [FromBody] CreateMaintenanceRecordRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _service.LinkMaintenanceRecordAsync(id, request, cancellationToken);
        if (!result.IsSuccess)
            return ToErrorResponse(result.Error!, result.Code);

        return CreatedAtAction(nameof(GetById), new { id }, result.Value);
    }

    private IActionResult ToErrorResponse(string error, ErrorCode? code) => code switch
    {
        ErrorCode.NotFound       => NotFound(new { error }),
        ErrorCode.Conflict       => Conflict(new { error }),
        ErrorCode.InvalidOperation => UnprocessableEntity(new { error }),
        _                        => BadRequest(new { error })
    };
}
