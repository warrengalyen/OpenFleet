using System.Security.Claims;
using System.Text.Json;
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
public class PartsController : ControllerBase
{
    private readonly IOpenFleetDbContext _context;
    private readonly ILogger<PartsController> _logger;
    private readonly AuditService _auditService;
    private readonly IApplicationSettingsProvider _settingsProvider;

    public PartsController(
        IOpenFleetDbContext context,
        ILogger<PartsController> logger,
        AuditService auditService,
        IApplicationSettingsProvider settingsProvider)
    {
        _context = context;
        _logger = logger;
        _auditService = auditService;
        _settingsProvider = settingsProvider;
    }

    /// <summary>Returns all parts with optional filtering and search.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PartResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] Guid? vendorId,
        [FromQuery] bool? lowStockOnly,
        CancellationToken cancellationToken)
    {
        var lowStockThreshold = (await _settingsProvider.GetValuesAsync(cancellationToken)).LowPartsStockThreshold;
        var query = _context.Parts
            .Include(p => p.Vendor)
            .AsNoTracking()
            .AsQueryable();

        if (vendorId.HasValue)
            query = query.Where(p => p.VendorId == vendorId.Value);

        if (lowStockOnly == true)
            query = query.Where(p => p.QuantityOnHand <= lowStockThreshold);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(term) ||
                p.PartNumber.ToLower().Contains(term) ||
                (p.Vendor != null && p.Vendor.Name.ToLower().Contains(term)));
        }

        var parts = await query
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);

        return Ok(parts.Select(p => ToResponse(p, lowStockThreshold)));
    }

    /// <summary>Returns a part by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var lowStockThreshold = (await _settingsProvider.GetValuesAsync(cancellationToken)).LowPartsStockThreshold;
        var part = await _context.Parts
            .Include(p => p.Vendor)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (part is null)
            return NotFound();

        return Ok(ToResponse(part, lowStockThreshold));
    }

    /// <summary>Returns quantity change history for a part from audit logs and integration syncs.</summary>
    [HttpGet("{id:guid}/usage-history")]
    [ProducesResponseType(typeof(IEnumerable<PartUsageHistoryEntry>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUsageHistory(Guid id, CancellationToken cancellationToken)
    {
        var exists = await _context.Parts.AnyAsync(p => p.Id == id, cancellationToken);
        if (!exists)
            return NotFound();

        var history = new List<PartUsageHistoryEntry>();

        var auditEntries = await _context.AuditLogs
            .AsNoTracking()
            .Where(l => l.EntityType == "Part" && l.EntityId == id)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync(cancellationToken);

        foreach (var entry in auditEntries)
        {
            var (previous, current) = ParseQuantitySnapshot(entry.OldValue, entry.NewValue);
            var source = entry.Action switch
            {
                AuditAction.PartCreated => "Created",
                AuditAction.PartUpdated => "Manual adjustment",
                AuditAction.PartDeleted => "Deleted",
                _ => "Update"
            };

            history.Add(new PartUsageHistoryEntry(
                entry.CreatedAt,
                source,
                previous,
                current ?? previous ?? 0,
                entry.Notes));
        }

        var integrationLogs = await _context.IntegrationLogs
            .AsNoTracking()
            .Where(l => l.Source == IntegrationSource.PartsSupplier
                && l.Status == IntegrationStatus.Success
                && l.Payload != null)
            .OrderByDescending(l => l.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);

        foreach (var log in integrationLogs)
        {
            try
            {
                using var doc = JsonDocument.Parse(log.Payload!);
                if (doc.RootElement.ValueKind != JsonValueKind.Array)
                    continue;

                foreach (var element in doc.RootElement.EnumerateArray())
                {
                    if (!element.TryGetProperty("partId", out var partIdProp))
                        continue;

                    if (!Guid.TryParse(partIdProp.GetString(), out var partId) || partId != id)
                        continue;

                    var newQty = element.TryGetProperty("supplierStock", out var stockProp)
                        ? stockProp.GetInt32()
                        : 0;

                    history.Add(new PartUsageHistoryEntry(
                        log.CreatedAt,
                        "Parts supplier sync",
                        null,
                        newQty,
                        $"Integration sync processed {log.RecordsProcessed ?? 0} records"));
                }
            }
            catch (JsonException)
            {
                // Skip malformed payloads
            }
        }

        return Ok(history.OrderByDescending(h => h.OccurredAt).ToList());
    }

    /// <summary>Creates a new part.</summary>
    [HttpPost]
    [Authorize(Roles = AuthorizationPolicies.FleetManagerOrAbove)]
    [ProducesResponseType(typeof(PartResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePartRequest request,
        CancellationToken cancellationToken)
    {
        var vendorExists = await _context.Vendors
            .AnyAsync(v => v.Id == request.VendorId, cancellationToken);

        if (!vendorExists)
            return BadRequest(new { message = "Vendor not found." });

        var duplicate = await _context.Parts
            .AnyAsync(p => p.PartNumber == request.PartNumber, cancellationToken);

        if (duplicate)
            return Conflict(new { message = $"A part with number '{request.PartNumber}' already exists." });

        var part = new Part
        {
            Name = request.Name,
            PartNumber = request.PartNumber,
            VendorId = request.VendorId,
            QuantityOnHand = request.QuantityOnHand,
            UnitCost = request.UnitCost
        };

        _context.Parts.Add(part);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditAction.PartCreated,
            "Part",
            part.Id,
            User.FindFirstValue(ClaimTypes.Email),
            oldValue: null,
            newValue: $"Quantity={part.QuantityOnHand}",
            notes: $"Part '{part.Name}' created",
            cancellationToken: cancellationToken);

        var created = await _context.Parts
            .Include(p => p.Vendor)
            .AsNoTracking()
            .FirstAsync(p => p.Id == part.Id, cancellationToken);

        _logger.LogInformation("Part created: {PartId} Number={PartNumber}", part.Id, part.PartNumber);

        var lowStockThreshold = (await _settingsProvider.GetValuesAsync(cancellationToken)).LowPartsStockThreshold;
        return CreatedAtAction(nameof(GetById), new { id = part.Id }, ToResponse(created, lowStockThreshold));
    }

    /// <summary>Updates an existing part.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = AuthorizationPolicies.FleetManagerOrAbove)]
    [ProducesResponseType(typeof(PartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdatePartRequest request,
        CancellationToken cancellationToken)
    {
        var part = await _context.Parts
            .Include(p => p.Vendor)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (part is null)
            return NotFound();

        if (request.VendorId.HasValue)
        {
            var vendorExists = await _context.Vendors
                .AnyAsync(v => v.Id == request.VendorId.Value, cancellationToken);
            if (!vendorExists)
                return BadRequest(new { message = "Vendor not found." });
        }

        if (request.PartNumber is not null && request.PartNumber != part.PartNumber)
        {
            var duplicate = await _context.Parts
                .AnyAsync(p => p.PartNumber == request.PartNumber && p.Id != id, cancellationToken);
            if (duplicate)
                return Conflict(new { message = $"A part with number '{request.PartNumber}' already exists." });
        }

        var oldSnapshot = $"Quantity={part.QuantityOnHand}, UnitCost={part.UnitCost}";

        if (request.Name is not null) part.Name = request.Name;
        if (request.PartNumber is not null) part.PartNumber = request.PartNumber;
        if (request.VendorId.HasValue) part.VendorId = request.VendorId.Value;
        if (request.QuantityOnHand.HasValue) part.QuantityOnHand = request.QuantityOnHand.Value;
        if (request.UnitCost.HasValue) part.UnitCost = request.UnitCost.Value;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            AuditAction.PartUpdated,
            "Part",
            part.Id,
            User.FindFirstValue(ClaimTypes.Email),
            oldValue: oldSnapshot,
            newValue: $"Quantity={part.QuantityOnHand}, UnitCost={part.UnitCost}",
            notes: $"Part '{part.Name}' updated",
            cancellationToken: cancellationToken);

        var updated = await _context.Parts
            .Include(p => p.Vendor)
            .AsNoTracking()
            .FirstAsync(p => p.Id == id, cancellationToken);

        var lowStockThreshold = (await _settingsProvider.GetValuesAsync(cancellationToken)).LowPartsStockThreshold;
        return Ok(ToResponse(updated, lowStockThreshold));
    }

    /// <summary>Deletes a part from inventory.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AuthorizationPolicies.FleetManagerOrAbove)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var part = await _context.Parts.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (part is null)
            return NotFound();

        await _auditService.LogAsync(
            AuditAction.PartDeleted,
            "Part",
            part.Id,
            User.FindFirstValue(ClaimTypes.Email),
            oldValue: $"Quantity={part.QuantityOnHand}",
            newValue: null,
            notes: $"Part '{part.Name}' deleted",
            cancellationToken: cancellationToken);

        _context.Parts.Remove(part);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Part deleted: {PartId}", id);

        return NoContent();
    }

    private static PartResponse ToResponse(Part p, int lowStockThreshold)
    {
        var totalValue = (decimal)p.QuantityOnHand * p.UnitCost;
        return new PartResponse(
            p.Id,
            p.Name,
            p.PartNumber,
            p.VendorId,
            p.Vendor?.Name ?? string.Empty,
            p.QuantityOnHand,
            p.UnitCost,
            totalValue,
            p.QuantityOnHand <= lowStockThreshold,
            lowStockThreshold,
            p.CreatedAt,
            p.UpdatedAt);
    }

    private static (int? Previous, int? Current) ParseQuantitySnapshot(string? oldValue, string? newValue)
    {
        int? ParseQty(string? snapshot)
        {
            if (string.IsNullOrWhiteSpace(snapshot))
                return null;

            var qtyPart = snapshot.Split(',').FirstOrDefault(s => s.TrimStart().StartsWith("Quantity="));
            if (qtyPart is null)
                return null;

            var value = qtyPart.Split('=').LastOrDefault();
            return int.TryParse(value, out var qty) ? qty : null;
        }

        return (ParseQty(oldValue), ParseQty(newValue));
    }
}
