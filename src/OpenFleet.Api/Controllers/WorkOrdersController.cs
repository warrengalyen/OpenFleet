using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Entities;

namespace OpenFleet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkOrdersController : ControllerBase
{
    private readonly IOpenFleetDbContext _context;
    private readonly ILogger<WorkOrdersController> _logger;

    public WorkOrdersController(IOpenFleetDbContext context, ILogger<WorkOrdersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>Returns all work orders.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<WorkOrder>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var workOrders = await _context.WorkOrders
            .Include(w => w.Vehicle)
            .Include(w => w.AssignedUser)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return Ok(workOrders);
    }

    /// <summary>Returns a work order by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(WorkOrder), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var workOrder = await _context.WorkOrders
            .Include(w => w.Vehicle)
            .Include(w => w.AssignedUser)
            .Include(w => w.MaintenanceRecord)
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);

        if (workOrder is null)
            return NotFound();

        return Ok(workOrder);
    }
}
