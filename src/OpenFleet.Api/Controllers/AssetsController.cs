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
public class AssetsController : ControllerBase
{
    private readonly IOpenFleetDbContext _context;
    private readonly ILogger<AssetsController> _logger;

    public AssetsController(IOpenFleetDbContext context, ILogger<AssetsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>Returns all assets with optional filtering.</summary>
    /// <param name="status">Filter by asset status.</param>
    /// <param name="type">Filter by asset type (case-insensitive).</param>
    /// <param name="condition">Filter by asset condition.</param>
    /// <param name="departmentId">Filter by department.</param>
    /// <param name="vehicleId">Filter by assigned vehicle.</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AssetResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] AssetStatus? status,
        [FromQuery] string? type,
        [FromQuery] AssetCondition? condition,
        [FromQuery] Guid? departmentId,
        [FromQuery] Guid? vehicleId,
        CancellationToken cancellationToken)
    {
        var query = _context.Assets
            .Include(a => a.Department)
            .Include(a => a.Vehicle)
            .AsNoTracking()
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(a => a.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(a => a.Type.ToLower().Contains(type.ToLower()));

        if (condition.HasValue)
            query = query.Where(a => a.Condition == condition.Value);

        if (departmentId.HasValue)
            query = query.Where(a => a.DepartmentId == departmentId.Value);

        if (vehicleId.HasValue)
            query = query.Where(a => a.VehicleId == vehicleId.Value);

        var assets = await query
            .OrderBy(a => a.Name)
            .Select(a => ToResponse(a))
            .ToListAsync(cancellationToken);

        return Ok(assets);
    }

    /// <summary>Returns an asset by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AssetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var asset = await _context.Assets
            .Include(a => a.Department)
            .Include(a => a.Vehicle)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (asset is null)
            return NotFound();

        return Ok(ToResponse(asset));
    }

    /// <summary>Creates a new asset.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(AssetResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateAssetRequest request,
        CancellationToken cancellationToken)
    {
        var departmentExists = await _context.Departments
            .AnyAsync(d => d.Id == request.DepartmentId, cancellationToken);
        if (!departmentExists)
            return BadRequest(new { error = "Department not found." });

        var duplicate = await _context.Assets
            .AnyAsync(a => a.AssetTag == request.AssetTag, cancellationToken);
        if (duplicate)
            return Conflict(new { error = $"Asset tag '{request.AssetTag}' is already in use." });

        if (request.VehicleId.HasValue)
        {
            var vehicleExists = await _context.Vehicles
                .AnyAsync(v => v.Id == request.VehicleId.Value, cancellationToken);
            if (!vehicleExists)
                return BadRequest(new { error = "Vehicle not found." });
        }

        var asset = new Asset
        {
            AssetTag = request.AssetTag,
            Name = request.Name,
            Type = request.Type,
            Condition = request.Condition,
            Status = request.Status,
            DepartmentId = request.DepartmentId,
            VehicleId = request.VehicleId,
            PurchaseDate = DateTime.UtcNow
        };

        _context.Assets.Add(asset);
        await _context.SaveChangesAsync(cancellationToken);

        var created = await _context.Assets
            .Include(a => a.Department)
            .Include(a => a.Vehicle)
            .AsNoTracking()
            .FirstAsync(a => a.Id == asset.Id, cancellationToken);

        _logger.LogInformation("Asset created: {AssetId} Tag={AssetTag}", asset.Id, asset.AssetTag);

        return CreatedAtAction(nameof(GetById), new { id = asset.Id }, ToResponse(created));
    }

    /// <summary>Updates an existing asset.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(AssetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateAssetRequest request,
        CancellationToken cancellationToken)
    {
        var asset = await _context.Assets
            .Include(a => a.Department)
            .Include(a => a.Vehicle)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (asset is null)
            return NotFound();

        if (request.DepartmentId.HasValue)
        {
            var departmentExists = await _context.Departments
                .AnyAsync(d => d.Id == request.DepartmentId.Value, cancellationToken);
            if (!departmentExists)
                return BadRequest(new { error = "Department not found." });
        }

        if (request.AssetTag is not null && request.AssetTag != asset.AssetTag)
        {
            var duplicate = await _context.Assets
                .AnyAsync(a => a.AssetTag == request.AssetTag && a.Id != id, cancellationToken);
            if (duplicate)
                return Conflict(new { error = $"Asset tag '{request.AssetTag}' is already in use." });
        }

        if (request.VehicleId.HasValue)
        {
            var vehicleExists = await _context.Vehicles
                .AnyAsync(v => v.Id == request.VehicleId.Value, cancellationToken);
            if (!vehicleExists)
                return BadRequest(new { error = "Vehicle not found." });
        }

        if (request.AssetTag is not null) asset.AssetTag = request.AssetTag;
        if (request.Name is not null) asset.Name = request.Name;
        if (request.Type is not null) asset.Type = request.Type;
        if (request.Condition.HasValue) asset.Condition = request.Condition.Value;
        if (request.Status.HasValue) asset.Status = request.Status.Value;
        if (request.DepartmentId.HasValue) asset.DepartmentId = request.DepartmentId.Value;
        if (request.VehicleId is not null) asset.VehicleId = request.VehicleId;

        await _context.SaveChangesAsync(cancellationToken);

        var updated = await _context.Assets
            .Include(a => a.Department)
            .Include(a => a.Vehicle)
            .AsNoTracking()
            .FirstAsync(a => a.Id == id, cancellationToken);

        return Ok(ToResponse(updated));
    }

    /// <summary>Soft-deletes an asset by setting its status to Decommissioned.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (asset is null)
            return NotFound();

        asset.Status = AssetStatus.Decommissioned;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Asset decommissioned: {AssetId}", id);

        return NoContent();
    }

    private static AssetResponse ToResponse(Asset a) => new(
        a.Id,
        a.AssetTag,
        a.Name,
        a.Type,
        a.Condition,
        a.Status,
        a.DepartmentId,
        a.Department?.Name,
        a.VehicleId,
        a.Vehicle is null ? null : $"{a.Vehicle.Year} {a.Vehicle.Make} {a.Vehicle.Model}",
        a.PurchaseDate,
        a.CreatedAt,
        a.UpdatedAt
    );
}
