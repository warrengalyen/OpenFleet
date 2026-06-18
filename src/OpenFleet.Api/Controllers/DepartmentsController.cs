using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;
using OpenFleet.Application.Services;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = AuthorizationPolicies.AnyAuthenticated)]
public class DepartmentsController : ControllerBase
{
    private readonly IOpenFleetDbContext _context;
    private readonly ILogger<DepartmentsController> _logger;
    private readonly AuditService _auditService;

    public DepartmentsController(
        IOpenFleetDbContext context,
        ILogger<DepartmentsController> logger,
        AuditService auditService)
    {
        _context = context;
        _logger = logger;
        _auditService = auditService;
    }

    /// <summary>Returns all departments.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<DepartmentResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var departments = await _context.Departments
            .Include(d => d.Vehicles)
            .Include(d => d.Users)
            .AsNoTracking()
            .OrderBy(d => d.Name)
            .ToListAsync(cancellationToken);

        var assetCounts = await GetAssetCountsByDepartmentAsync(cancellationToken);

        var response = departments
            .Select(d => ToResponse(d, assetCounts.GetValueOrDefault(d.Id, 0)))
            .ToList();

        return Ok(response);
    }

    /// <summary>Returns a department by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DepartmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var department = await _context.Departments
            .Include(d => d.Vehicles)
            .Include(d => d.Users)
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (department is null)
            return NotFound();

        var assetCount = await _context.Assets
            .CountAsync(a => a.DepartmentId == id, cancellationToken);

        return Ok(ToResponse(department, assetCount));
    }

    /// <summary>Creates a new department.</summary>
    [HttpPost]
    [Authorize(Roles = AuthorizationPolicies.AdminOnly)]
    [ProducesResponseType(typeof(DepartmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromBody] CreateDepartmentRequest request,
        CancellationToken cancellationToken)
    {
        var normalizedName = request.Name.Trim();
        var normalizedCode = request.Code.Trim().ToUpperInvariant();

        var nameConflict = await _context.Departments
            .AnyAsync(d => d.Name.ToLower() == normalizedName.ToLower(), cancellationToken);
        if (nameConflict)
        {
            return Conflict(new { message = $"A department named '{normalizedName}' already exists." });
        }

        var codeConflict = await _context.Departments
            .AnyAsync(d => d.Code.ToLower() == normalizedCode.ToLower(), cancellationToken);
        if (codeConflict)
        {
            return Conflict(new { message = $"A department with code '{normalizedCode}' already exists." });
        }

        var department = new Department
        {
            Name = normalizedName,
            Code = normalizedCode
        };

        _context.Departments.Add(department);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditAction.DepartmentCreated,
            "Department",
            department.Id,
            User.FindFirstValue(ClaimTypes.Email),
            notes: $"Department '{department.Name}' ({department.Code}) created",
            cancellationToken: cancellationToken);

        _logger.LogInformation(
            "Department created: {DepartmentId} Name={Name} Code={Code}",
            department.Id,
            department.Name,
            department.Code);

        return CreatedAtAction(
            nameof(GetById),
            new { id = department.Id },
            ToResponse(department, assetCount: 0));
    }

    /// <summary>Updates an existing department.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = AuthorizationPolicies.AdminOnly)]
    [ProducesResponseType(typeof(DepartmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateDepartmentRequest request,
        CancellationToken cancellationToken)
    {
        var department = await _context.Departments
            .Include(d => d.Vehicles)
            .Include(d => d.Users)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (department is null)
            return NotFound();

        if (request.Name is not null)
        {
            var normalizedName = request.Name.Trim();
            var nameConflict = await _context.Departments
                .AnyAsync(
                    d => d.Id != id && d.Name.ToLower() == normalizedName.ToLower(),
                    cancellationToken);
            if (nameConflict)
            {
                return Conflict(new { message = $"A department named '{normalizedName}' already exists." });
            }

            department.Name = normalizedName;
        }

        if (request.Code is not null)
        {
            var normalizedCode = request.Code.Trim().ToUpperInvariant();
            var codeConflict = await _context.Departments
                .AnyAsync(
                    d => d.Id != id && d.Code.ToLower() == normalizedCode.ToLower(),
                    cancellationToken);
            if (codeConflict)
            {
                return Conflict(new { message = $"A department with code '{normalizedCode}' already exists." });
            }

            department.Code = normalizedCode;
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditAction.DepartmentUpdated,
            "Department",
            department.Id,
            User.FindFirstValue(ClaimTypes.Email),
            notes: $"Department '{department.Name}' ({department.Code}) updated",
            cancellationToken: cancellationToken);

        var assetCount = await _context.Assets
            .CountAsync(a => a.DepartmentId == id, cancellationToken);

        return Ok(ToResponse(department, assetCount));
    }

    /// <summary>Deletes a department. Fails if vehicles, users, or assets are still assigned.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AuthorizationPolicies.AdminOnly)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var department = await _context.Departments
            .Include(d => d.Vehicles)
            .Include(d => d.Users)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (department is null)
            return NotFound();

        var assetCount = await _context.Assets
            .CountAsync(a => a.DepartmentId == id, cancellationToken);

        if (department.Vehicles.Count > 0 || department.Users.Count > 0 || assetCount > 0)
        {
            return Conflict(new
            {
                message =
                    $"Cannot delete department '{department.Name}' because it has {department.Vehicles.Count} vehicle(s), {department.Users.Count} user(s), and {assetCount} asset(s) assigned. Reassign or remove those records first."
            });
        }

        await _auditService.LogAsync(
            AuditAction.DepartmentDeleted,
            "Department",
            department.Id,
            User.FindFirstValue(ClaimTypes.Email),
            notes: $"Department '{department.Name}' ({department.Code}) deleted",
            cancellationToken: cancellationToken);

        _context.Departments.Remove(department);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Department deleted: {DepartmentId}", id);

        return NoContent();
    }

    private async Task<Dictionary<Guid, int>> GetAssetCountsByDepartmentAsync(CancellationToken cancellationToken)
    {
        return await _context.Assets
            .Where(a => a.DepartmentId != null)
            .GroupBy(a => a.DepartmentId!.Value)
            .Select(g => new { DepartmentId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.DepartmentId, x => x.Count, cancellationToken);
    }

    private static DepartmentResponse ToResponse(Department department, int assetCount) => new(
        department.Id,
        department.Name,
        department.Code,
        department.Vehicles.Count,
        department.Users.Count,
        assetCount,
        department.Vehicles.Count > 0 || department.Users.Count > 0 || assetCount > 0,
        department.CreatedAt,
        department.UpdatedAt);
}
