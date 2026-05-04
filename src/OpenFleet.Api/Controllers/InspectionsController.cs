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
[Authorize(Roles = AuthorizationPolicies.AnyAuthenticated)]
public class InspectionsController : ControllerBase
{
    private readonly InspectionService _inspectionService;

    public InspectionsController(InspectionService inspectionService)
    {
        _inspectionService = inspectionService;
    }

    /// <summary>List all inspections with optional filters.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<InspectionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? vehicleId,
        [FromQuery] Guid? assetId,
        [FromQuery] InspectionStatus? status,
        [FromQuery] Guid? inspectorUserId,
        CancellationToken cancellationToken)
    {
        var results = await _inspectionService.GetAllAsync(vehicleId, assetId, status, inspectorUserId, cancellationToken);
        return Ok(results);
    }

    /// <summary>Get a single inspection by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(InspectionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _inspectionService.GetByIdAsync(id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Submit a new inspection. If the status is Failed, a work order is automatically created.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = AuthorizationPolicies.TechnicianOrAbove)]
    [ProducesResponseType(typeof(InspectionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(
        [FromBody] CreateInspectionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _inspectionService.CreateAsync(request, cancellationToken);

        if (!result.IsSuccess)
            return ToErrorResponse(result);

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    /// <summary>
    /// Update an inspection's status or notes. If transitioned to Failed, a work order is auto-created.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = AuthorizationPolicies.TechnicianOrAbove)]
    [ProducesResponseType(typeof(InspectionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateInspectionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _inspectionService.UpdateAsync(id, request, cancellationToken);

        if (!result.IsSuccess)
            return ToErrorResponse(result);

        return Ok(result.Value);
    }

    /// <summary>
    /// Inspections are immutable audit records — deletion is not supported.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status405MethodNotAllowed)]
    public IActionResult Delete(Guid id)
        => StatusCode(StatusCodes.Status405MethodNotAllowed,
            new { message = "Inspections are immutable audit records and cannot be deleted." });

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
