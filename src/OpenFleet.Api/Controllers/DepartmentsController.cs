using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;

namespace OpenFleet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = AuthorizationPolicies.AnyAuthenticated)]
public class DepartmentsController : ControllerBase
{
    private readonly IOpenFleetDbContext _context;

    public DepartmentsController(IOpenFleetDbContext context)
    {
        _context = context;
    }

    /// <summary>Returns all departments.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<DepartmentResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var departments = await _context.Departments
            .Include(d => d.Vehicles)
            .AsNoTracking()
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentResponse(
                d.Id,
                d.Name,
                d.Code,
                d.Vehicles.Count,
                d.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(departments);
    }

    /// <summary>Returns a department by ID including its vehicles.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DepartmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var department = await _context.Departments
            .Include(d => d.Vehicles)
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (department is null)
            return NotFound();

        return Ok(new DepartmentResponse(
            department.Id,
            department.Name,
            department.Code,
            department.Vehicles.Count,
            department.CreatedAt));
    }
}
