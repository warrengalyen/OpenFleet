using Microsoft.AspNetCore.Mvc;

namespace OpenFleet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    /// <summary>Basic liveness check.</summary>
    [HttpGet("ping")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Ping() => Ok(new { status = "ok", timestamp = DateTime.UtcNow });
}
