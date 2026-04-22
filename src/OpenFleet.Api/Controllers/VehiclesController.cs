using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class VehiclesController : ControllerBase
{
    private readonly IOpenFleetDbContext _context;
    private readonly ILogger<VehiclesController> _logger;

    public VehiclesController(IOpenFleetDbContext context, ILogger<VehiclesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>Returns all vehicles with optional filtering and search.</summary>
    /// <param name="status">Filter by vehicle status.</param>
    /// <param name="make">Filter by make (case-insensitive).</param>
    /// <param name="model">Filter by model (case-insensitive).</param>
    /// <param name="year">Filter by year.</param>
    /// <param name="departmentId">Filter by department.</param>
    /// <param name="search">Search VIN, license plate, make, or model.</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<VehicleResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] VehicleStatus? status,
        [FromQuery] string? make,
        [FromQuery] string? model,
        [FromQuery] int? year,
        [FromQuery] Guid? departmentId,
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var query = _context.Vehicles
            .Include(v => v.Department)
            .AsNoTracking()
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(v => v.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(make))
            query = query.Where(v => v.Make.ToLower().Contains(make.ToLower()));

        if (!string.IsNullOrWhiteSpace(model))
            query = query.Where(v => v.Model.ToLower().Contains(model.ToLower()));

        if (year.HasValue)
            query = query.Where(v => v.Year == year.Value);

        if (departmentId.HasValue)
            query = query.Where(v => v.DepartmentId == departmentId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(v =>
                v.VIN.ToLower().Contains(term) ||
                v.LicensePlate.ToLower().Contains(term) ||
                v.Make.ToLower().Contains(term) ||
                v.Model.ToLower().Contains(term));
        }

        var vehicles = await query
            .OrderBy(v => v.Make).ThenBy(v => v.Model)
            .Select(v => ToResponse(v))
            .ToListAsync(cancellationToken);

        return Ok(vehicles);
    }

    /// <summary>Returns a vehicle by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(VehicleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var vehicle = await _context.Vehicles
            .Include(v => v.Department)
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (vehicle is null)
            return NotFound();

        return Ok(ToResponse(vehicle));
    }

    /// <summary>Creates a new vehicle.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(VehicleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateVehicleRequest request,
        CancellationToken cancellationToken)
    {
        var departmentExists = await _context.Departments
            .AnyAsync(d => d.Id == request.DepartmentId, cancellationToken);

        if (!departmentExists)
            return BadRequest(new { error = "Department not found." });

        var duplicate = await _context.Vehicles
            .AnyAsync(v => v.VIN == request.VIN, cancellationToken);

        if (duplicate)
            return Conflict(new { error = $"A vehicle with VIN '{request.VIN}' already exists." });

        var vehicle = new Vehicle
        {
            VIN = request.VIN,
            LicensePlate = request.LicensePlate,
            Make = request.Make,
            Model = request.Model,
            Year = request.Year,
            Mileage = request.Mileage,
            Status = request.Status,
            DepartmentId = request.DepartmentId
        };

        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync(cancellationToken);

        var created = await _context.Vehicles
            .Include(v => v.Department)
            .AsNoTracking()
            .FirstAsync(v => v.Id == vehicle.Id, cancellationToken);

        _logger.LogInformation("Vehicle created: {VehicleId} VIN={VIN}", vehicle.Id, vehicle.VIN);

        return CreatedAtAction(nameof(GetById), new { id = vehicle.Id }, ToResponse(created));
    }

    /// <summary>Updates an existing vehicle.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(VehicleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateVehicleRequest request,
        CancellationToken cancellationToken)
    {
        var vehicle = await _context.Vehicles
            .Include(v => v.Department)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (vehicle is null)
            return NotFound();

        if (request.DepartmentId.HasValue)
        {
            var departmentExists = await _context.Departments
                .AnyAsync(d => d.Id == request.DepartmentId.Value, cancellationToken);
            if (!departmentExists)
                return BadRequest(new { error = "Department not found." });
        }

        if (request.VIN is not null && request.VIN != vehicle.VIN)
        {
            var duplicate = await _context.Vehicles
                .AnyAsync(v => v.VIN == request.VIN && v.Id != id, cancellationToken);
            if (duplicate)
                return Conflict(new { error = $"A vehicle with VIN '{request.VIN}' already exists." });
        }

        if (request.VIN is not null) vehicle.VIN = request.VIN;
        if (request.LicensePlate is not null) vehicle.LicensePlate = request.LicensePlate;
        if (request.Make is not null) vehicle.Make = request.Make;
        if (request.Model is not null) vehicle.Model = request.Model;
        if (request.Year.HasValue) vehicle.Year = request.Year.Value;
        if (request.Mileage.HasValue) vehicle.Mileage = request.Mileage.Value;
        if (request.Status.HasValue) vehicle.Status = request.Status.Value;
        if (request.DepartmentId.HasValue) vehicle.DepartmentId = request.DepartmentId.Value;

        await _context.SaveChangesAsync(cancellationToken);

        var updated = await _context.Vehicles
            .Include(v => v.Department)
            .AsNoTracking()
            .FirstAsync(v => v.Id == id, cancellationToken);

        return Ok(ToResponse(updated));
    }

    /// <summary>Soft-deletes a vehicle by setting its status to Retired.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (vehicle is null)
            return NotFound();

        vehicle.Status = VehicleStatus.Retired;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Vehicle retired: {VehicleId}", id);

        return NoContent();
    }

    private static VehicleResponse ToResponse(Vehicle v) => new(
        v.Id,
        v.VIN,
        v.LicensePlate,
        v.Make,
        v.Model,
        v.Year,
        v.Mileage,
        v.Status,
        v.DepartmentId,
        v.Department?.Name ?? string.Empty,
        v.CreatedAt,
        v.UpdatedAt
    );
}
