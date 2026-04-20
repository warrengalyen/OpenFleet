using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Entities;

namespace OpenFleet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VehiclesController : ControllerBase
{
    private readonly IOpenFleetDbContext _context;
    private readonly ILogger<VehiclesController> _logger;

    public VehiclesController(IOpenFleetDbContext context, ILogger<VehiclesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>Returns all vehicles.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Vehicle>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var vehicles = await _context.Vehicles
            .Include(v => v.Department)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return Ok(vehicles);
    }

    /// <summary>Returns a vehicle by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Vehicle), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var vehicle = await _context.Vehicles
            .Include(v => v.Department)
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (vehicle is null)
            return NotFound();

        return Ok(vehicle);
    }
}
