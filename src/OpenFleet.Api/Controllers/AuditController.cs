using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Services;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = AuthorizationPolicies.FleetManagerOrAbove)]
public class AuditController : ControllerBase
{
    private readonly AuditService _auditService;

    public AuditController(AuditService auditService)
    {
        _auditService = auditService;
    }

    /// <summary>
    /// Returns filtered audit history. Supports filtering by action, entityId, entityType, and date range.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AuditLogResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory(
        [FromQuery] AuditAction? action,
        [FromQuery] Guid? entityId,
        [FromQuery] string? entityType,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var filter = new AuditHistoryFilter(action, entityId, entityType, dateFrom, dateTo, page, pageSize);
        var results = await _auditService.GetHistoryAsync(filter, cancellationToken);
        return Ok(results);
    }

    /// <summary>Returns a single audit log entry.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AuditLogResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var log = await _auditService.GetByIdAsync(id, cancellationToken);
        return log is null ? NotFound() : Ok(log);
    }
}
