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
public class VendorsController : ControllerBase
{
    private readonly IOpenFleetDbContext _context;
    private readonly ILogger<VendorsController> _logger;
    private readonly AuditService _auditService;

    public VendorsController(
        IOpenFleetDbContext context,
        ILogger<VendorsController> logger,
        AuditService auditService)
    {
        _context = context;
        _logger = logger;
        _auditService = auditService;
    }

    /// <summary>Returns all vendors with optional search.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<VendorResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var query = _context.Vendors
            .Include(v => v.Parts)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(v =>
                v.Name.ToLower().Contains(term) ||
                v.ContactName.ToLower().Contains(term) ||
                v.Email.ToLower().Contains(term) ||
                v.Phone.ToLower().Contains(term));
        }

        var vendors = await query
            .OrderBy(v => v.Name)
            .Select(v => ToResponse(v))
            .ToListAsync(cancellationToken);

        return Ok(vendors);
    }

    /// <summary>Returns a vendor by ID with assigned parts.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(VendorDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var vendor = await _context.Vendors
            .Include(v => v.Parts)
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (vendor is null)
            return NotFound();

        return Ok(ToDetailResponse(vendor));
    }

    /// <summary>Creates a new vendor.</summary>
    [HttpPost]
    [Authorize(Roles = AuthorizationPolicies.FleetManagerOrAbove)]
    [ProducesResponseType(typeof(VendorResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateVendorRequest request,
        CancellationToken cancellationToken)
    {
        var vendor = new Vendor
        {
            Name = request.Name,
            ContactName = request.ContactName,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address
        };

        _context.Vendors.Add(vendor);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditAction.VendorCreated,
            "Vendor",
            vendor.Id,
            User.FindFirstValue(ClaimTypes.Email),
            notes: $"Vendor '{vendor.Name}' created",
            cancellationToken: cancellationToken);

        var created = await _context.Vendors
            .Include(v => v.Parts)
            .AsNoTracking()
            .FirstAsync(v => v.Id == vendor.Id, cancellationToken);

        _logger.LogInformation("Vendor created: {VendorId} Name={Name}", vendor.Id, vendor.Name);

        return CreatedAtAction(nameof(GetById), new { id = vendor.Id }, ToResponse(created));
    }

    /// <summary>Updates an existing vendor.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = AuthorizationPolicies.FleetManagerOrAbove)]
    [ProducesResponseType(typeof(VendorResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateVendorRequest request,
        CancellationToken cancellationToken)
    {
        var vendor = await _context.Vendors
            .Include(v => v.Parts)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (vendor is null)
            return NotFound();

        if (request.Name is not null) vendor.Name = request.Name;
        if (request.ContactName is not null) vendor.ContactName = request.ContactName;
        if (request.Email is not null) vendor.Email = request.Email;
        if (request.Phone is not null) vendor.Phone = request.Phone;
        if (request.Address is not null) vendor.Address = request.Address;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditAction.VendorUpdated,
            "Vendor",
            vendor.Id,
            User.FindFirstValue(ClaimTypes.Email),
            notes: $"Vendor '{vendor.Name}' updated",
            cancellationToken: cancellationToken);

        var updated = await _context.Vendors
            .Include(v => v.Parts)
            .AsNoTracking()
            .FirstAsync(v => v.Id == id, cancellationToken);

        return Ok(ToResponse(updated));
    }

    /// <summary>Deletes a vendor. Fails if parts are still assigned.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AuthorizationPolicies.FleetManagerOrAbove)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var vendor = await _context.Vendors
            .Include(v => v.Parts)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (vendor is null)
            return NotFound();

        if (vendor.Parts.Any())
        {
            return Conflict(new
            {
                message = $"Cannot delete vendor '{vendor.Name}' because {vendor.Parts.Count} part(s) are still assigned. Reassign or delete those parts first."
            });
        }

        await _auditService.LogAsync(
            AuditAction.VendorDeleted,
            "Vendor",
            vendor.Id,
            User.FindFirstValue(ClaimTypes.Email),
            notes: $"Vendor '{vendor.Name}' deleted",
            cancellationToken: cancellationToken);

        _context.Vendors.Remove(vendor);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Vendor deleted: {VendorId}", id);

        return NoContent();
    }

    private static VendorResponse ToResponse(Vendor v) => new(
        v.Id,
        v.Name,
        v.ContactName,
        v.Email,
        v.Phone,
        v.Address,
        v.Parts.Count,
        v.Parts.Count > 0,
        v.CreatedAt,
        v.UpdatedAt);

    private static VendorDetailResponse ToDetailResponse(Vendor v) => new(
        v.Id,
        v.Name,
        v.ContactName,
        v.Email,
        v.Phone,
        v.Address,
        v.Parts.Count,
        v.Parts.Count > 0,
        v.Parts
            .OrderBy(p => p.Name)
            .Select(p => new VendorPartSummary(
                p.Id,
                p.Name,
                p.PartNumber,
                p.QuantityOnHand,
                p.QuantityOnHand <= InventoryConstants.LowStockThreshold))
            .ToList(),
        v.CreatedAt,
        v.UpdatedAt);
}
