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
[Authorize(Roles = AuthorizationPolicies.AnyAuthenticated)]
public class SettingsController : ControllerBase
{
    private readonly ApplicationSettingsService _settingsService;

    public SettingsController(ApplicationSettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    /// <summary>Returns the current application settings.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApplicationSettingsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var settings = await _settingsService.GetAsync(cancellationToken);
        return Ok(settings);
    }

    /// <summary>Updates application settings.</summary>
    [HttpPut]
    [Authorize(Roles = AuthorizationPolicies.AdminOnly)]
    [ProducesResponseType(typeof(ApplicationSettingsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(
        [FromBody] UpdateApplicationSettingsRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _settingsService.UpdateAsync(
            request,
            User.FindFirstValue(ClaimTypes.Email),
            cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new { message = result.Error });

        return Ok(result.Value);
    }
}
