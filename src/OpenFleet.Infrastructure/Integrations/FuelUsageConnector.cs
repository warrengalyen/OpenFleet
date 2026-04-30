using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Infrastructure.Integrations;

/// <summary>
/// Mock connector that simulates pulling fuel usage records from an external telematics system.
/// On import, applies mileage updates to matched vehicles.
/// </summary>
public class FuelUsageConnector : IExternalIntegrationConnector
{
    private readonly IOpenFleetDbContext _context;
    private readonly ILogger<FuelUsageConnector> _logger;
    private readonly bool _simulateFailure;

    public IntegrationSource Source => IntegrationSource.FuelUsage;

    public FuelUsageConnector(
        IOpenFleetDbContext context,
        ILogger<FuelUsageConnector> logger,
        bool simulateFailure = false)
    {
        _context = context;
        _logger = logger;
        _simulateFailure = simulateFailure;
    }

    public async Task<ConnectorResult> ImportAsync(CancellationToken cancellationToken = default)
    {
        if (_simulateFailure)
            return new ConnectorResult(false, string.Empty, 0, "Telematics API timeout after 30s.");

        var vehicles = await _context.Vehicles
            .Where(v => v.Status != VehicleStatus.Retired)
            .ToListAsync(cancellationToken);

        if (!vehicles.Any())
            return new ConnectorResult(true, "[]", 0, null);

        var rng = new Random();
        var records = vehicles.Select(v => new
        {
            vehicleId = v.Id,
            vin = v.VIN,
            fuelLiters = Math.Round(rng.NextDouble() * 80 + 10, 2),
            odometerKm = v.Mileage + rng.Next(50, 300),
            recordedAt = DateTime.UtcNow.AddMinutes(-rng.Next(5, 60))
        }).ToList();

        // Apply mileage updates
        foreach (var record in records)
        {
            var vehicle = vehicles.First(v => v.Id == record.vehicleId);
            vehicle.Mileage = record.odometerKm;
        }
        await _context.SaveChangesAsync(cancellationToken);

        var payload = JsonSerializer.Serialize(records);
        _logger.LogInformation("FuelUsage import: updated mileage for {Count} vehicles.", records.Count);

        return new ConnectorResult(true, payload, records.Count, null);
    }

    public async Task<ConnectorResult> ExportAsync(CancellationToken cancellationToken = default)
    {
        if (_simulateFailure)
            return new ConnectorResult(false, string.Empty, 0, "Export endpoint returned HTTP 503.");

        var vehicles = await _context.Vehicles
            .AsNoTracking()
            .Where(v => v.Status != VehicleStatus.Retired)
            .Select(v => new { v.Id, v.VIN, v.Mileage, v.Status })
            .ToListAsync(cancellationToken);

        var payload = JsonSerializer.Serialize(vehicles);
        return new ConnectorResult(true, payload, vehicles.Count, null);
    }
}
