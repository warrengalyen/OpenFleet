using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Infrastructure.Integrations;

/// <summary>
/// Mock connector that simulates importing asset records from an external CMMS or ERP system.
/// On import, upserts Asset entities based on the external asset tag.
/// </summary>
public class ExternalAssetConnector : IExternalIntegrationConnector
{
    private readonly IOpenFleetDbContext _context;
    private readonly ILogger<ExternalAssetConnector> _logger;
    private readonly bool _simulateFailure;

    public IntegrationSource Source => IntegrationSource.ExternalAsset;

    public ExternalAssetConnector(
        IOpenFleetDbContext context,
        ILogger<ExternalAssetConnector> logger,
        bool simulateFailure = false)
    {
        _context = context;
        _logger = logger;
        _simulateFailure = simulateFailure;
    }

    public async Task<ConnectorResult> ImportAsync(CancellationToken cancellationToken = default)
    {
        if (_simulateFailure)
            return new ConnectorResult(false, string.Empty, 0, "External CMMS returned unexpected schema (parse error).");

        // Simulate receiving 3 external asset records
        var externalAssets = new[]
        {
            new { assetTag = "EXT-001", name = "Forklift A", type = "Heavy Equipment", condition = "Good" },
            new { assetTag = "EXT-002", name = "Compressor Unit B", type = "Equipment", condition = "Fair" },
            new { assetTag = "EXT-003", name = "Safety Scanner", type = "Electronics", condition = "New" }
        };

        var processed = 0;
        var importedRecords = new List<object>();

        foreach (var ext in externalAssets)
        {
            var existing = await _context.Assets
                .FirstOrDefaultAsync(a => a.AssetTag == ext.assetTag, cancellationToken);

            var condition = ext.condition switch
            {
                "New" => AssetCondition.New,
                "Good" => AssetCondition.Good,
                "Fair" => AssetCondition.Fair,
                "Poor" => AssetCondition.Poor,
                _ => AssetCondition.Good
            };

            if (existing is null)
            {
                var asset = new Asset
                {
                    AssetTag = ext.assetTag,
                    Name = ext.name,
                    Type = ext.type,
                    Condition = condition,
                    Status = AssetStatus.Available
                };
                _context.Assets.Add(asset);
                importedRecords.Add(new { action = "created", ext.assetTag, ext.name });
            }
            else
            {
                existing.Name = ext.name;
                existing.Condition = condition;
                importedRecords.Add(new { action = "updated", ext.assetTag, ext.name });
            }

            processed++;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var payload = JsonSerializer.Serialize(importedRecords);
        _logger.LogInformation("ExternalAsset import: processed {Count} assets.", processed);

        return new ConnectorResult(true, payload, processed, null);
    }

    public async Task<ConnectorResult> ExportAsync(CancellationToken cancellationToken = default)
    {
        if (_simulateFailure)
            return new ConnectorResult(false, string.Empty, 0, "External CMMS export API connection refused.");

        var assets = await _context.Assets
            .AsNoTracking()
            .Select(a => new { a.Id, a.AssetTag, a.Name, a.Type, a.Condition, a.Status })
            .ToListAsync(cancellationToken);

        var payload = JsonSerializer.Serialize(assets);
        return new ConnectorResult(true, payload, assets.Count, null);
    }
}
