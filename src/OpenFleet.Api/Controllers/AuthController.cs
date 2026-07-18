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
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    /// <summary>Authenticate with email and password. Returns a signed JWT on success.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, cancellationToken);

        if (!result.IsSuccess)
            return Unauthorized(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>Returns the profile of the currently authenticated user.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(CurrentUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var guid))
            return Unauthorized();

        var user = await _authService.GetCurrentUserAsync(guid, cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    /// <summary>Updates the authenticated user's display name and/or password.</summary>
    [HttpPut("profile")]
    [Authorize]
    [ProducesResponseType(typeof(CurrentUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var guid))
            return Unauthorized();

        var updatedBy = User.FindFirstValue(ClaimTypes.Email)
                     ?? User.FindFirstValue("email");
        var result = await _authService.UpdateProfileAsync(guid, request, updatedBy, cancellationToken);

        if (!result.IsSuccess)
            return ToErrorResponse(result.Error!, result.Code);

        return Ok(result.Value);
    }

    private bool TryGetUserId(out Guid userId)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? User.FindFirstValue("sub");
        return Guid.TryParse(claim, out userId);
    }

    private IActionResult ToErrorResponse(string error, ErrorCode? code) =>
        code switch
        {
            ErrorCode.NotFound => NotFound(new { error }),
            ErrorCode.Conflict => Conflict(new { error }),
            _ => BadRequest(new { error })
        };
}
