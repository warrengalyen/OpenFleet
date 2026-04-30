using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Infrastructure.Integrations;

/// <summary>
/// Mock connector that simulates syncing parts inventory from an external parts supplier API.
/// On import, updates <see cref="Domain.Entities.Part.QuantityOnHand"/> for each matched part.
/// </summary>
public class PartsSupplierConnector : IExternalIntegrationConnector
{
    private readonly IOpenFleetDbContext _context;
    private readonly ILogger<PartsSupplierConnector> _logger;
    private readonly bool _simulateFailure;

    public IntegrationSource Source => IntegrationSource.PartsSupplier;

    public PartsSupplierConnector(
        IOpenFleetDbContext context,
        ILogger<PartsSupplierConnector> logger,
        bool simulateFailure = false)
    {
        _context = context;
        _logger = logger;
        _simulateFailure = simulateFailure;
    }

    public async Task<ConnectorResult> ImportAsync(CancellationToken cancellationToken = default)
    {
        if (_simulateFailure)
            return new ConnectorResult(false, string.Empty, 0, "Parts supplier API rate limit exceeded (HTTP 429).");

        var parts = await _context.Parts.ToListAsync(cancellationToken);

        if (!parts.Any())
            return new ConnectorResult(true, "[]", 0, null);

        var rng = new Random();
        var inventoryUpdates = parts.Select(p => new
        {
            partId = p.Id,
            partNumber = p.PartNumber,
            supplierStock = rng.Next(0, 200),
            unitCostUsd = Math.Round((double)p.UnitCost * (0.95 + rng.NextDouble() * 0.1), 2),
            syncedAt = DateTime.UtcNow
        }).ToList();

        // Apply stock updates
        foreach (var update in inventoryUpdates)
        {
            var part = parts.First(p => p.Id == update.partId);
            part.QuantityOnHand = update.supplierStock;
        }
        await _context.SaveChangesAsync(cancellationToken);

        var payload = JsonSerializer.Serialize(inventoryUpdates);
        _logger.LogInformation("PartsSupplier import: updated inventory for {Count} parts.", inventoryUpdates.Count);

        return new ConnectorResult(true, payload, inventoryUpdates.Count, null);
    }

    public async Task<ConnectorResult> ExportAsync(CancellationToken cancellationToken = default)
    {
        if (_simulateFailure)
            return new ConnectorResult(false, string.Empty, 0, "Parts supplier export endpoint unavailable.");

        var parts = await _context.Parts
            .AsNoTracking()
            .Select(p => new { p.Id, p.PartNumber, p.Name, p.QuantityOnHand, p.UnitCost })
            .ToListAsync(cancellationToken);

        var payload = JsonSerializer.Serialize(parts);
        return new ConnectorResult(true, payload, parts.Count, null);
    }
}
