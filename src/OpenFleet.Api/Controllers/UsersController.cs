using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Services;

namespace OpenFleet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public class UsersController : ControllerBase
{
    private readonly UserManagementService _service;

    public UsersController(UserManagementService service)
    {
        _service = service;
    }

    /// <summary>Returns all registered users.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<UserResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
        => Ok(await _service.GetAllAsync(cancellationToken));

    /// <summary>Returns a single user by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var user = await _service.GetByIdAsync(id, cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    /// <summary>Creates a new user account.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromBody] CreateUserRequest request,
        CancellationToken cancellationToken)
    {
        var createdBy = User.FindFirstValue(ClaimTypes.Email);
        var result = await _service.CreateAsync(request, createdBy, cancellationToken);

        if (!result.IsSuccess)
            return ToErrorResponse(result.Error!, result.Code);

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    /// <summary>Updates user fields. All fields are optional.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateUserRequest request,
        CancellationToken cancellationToken)
    {
        var updatedBy = User.FindFirstValue(ClaimTypes.Email);
        var result = await _service.UpdateAsync(id, request, updatedBy, cancellationToken);

        if (!result.IsSuccess)
            return ToErrorResponse(result.Error!, result.Code);

        return Ok(result.Value);
    }

    /// <summary>Deactivates a user (soft delete). The account remains in the database.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(
        Guid id,
        CancellationToken cancellationToken)
    {
        var deactivatedBy = User.FindFirstValue(ClaimTypes.Email);
        var result = await _service.DeactivateAsync(id, deactivatedBy, cancellationToken);

        if (!result.IsSuccess)
            return ToErrorResponse(result.Error!, result.Code);

        return NoContent();
    }

    private IActionResult ToErrorResponse(string error, ErrorCode? code) =>
        code switch
        {
            ErrorCode.NotFound => NotFound(new { error }),
            ErrorCode.Conflict => Conflict(new { error }),
            ErrorCode.Forbidden => Problem(
                detail: error,
                statusCode: StatusCodes.Status403Forbidden,
                title: AuthController.DemoRestrictionTitle,
                type: "https://httpstatuses.io/403"),
            _ => BadRequest(new { error })
        };
}
