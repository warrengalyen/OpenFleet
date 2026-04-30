using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Infrastructure.Integrations;

/// <summary>
/// Mock connector that simulates pulling repair status updates from an external vendor portal.
/// On import, updates matching open WorkOrders based on vendor-reported statuses.
/// </summary>
public class VendorRepairConnector : IExternalIntegrationConnector
{
    private readonly IOpenFleetDbContext _context;
    private readonly ILogger<VendorRepairConnector> _logger;
    private readonly bool _simulateFailure;

    public IntegrationSource Source => IntegrationSource.VendorRepair;

    public VendorRepairConnector(
        IOpenFleetDbContext context,
        ILogger<VendorRepairConnector> logger,
        bool simulateFailure = false)
    {
        _context = context;
        _logger = logger;
        _simulateFailure = simulateFailure;
    }

    public async Task<ConnectorResult> ImportAsync(CancellationToken cancellationToken = default)
    {
        if (_simulateFailure)
            return new ConnectorResult(false, string.Empty, 0, "Vendor portal authentication failed (HTTP 401).");

        var openOrders = await _context.WorkOrders
            .Where(w => w.Status == WorkOrderStatus.InProgress || w.Status == WorkOrderStatus.WaitingForParts)
            .ToListAsync(cancellationToken);

        if (!openOrders.Any())
            return new ConnectorResult(true, "[]", 0, null);

        var rng = new Random();
        var updates = openOrders.Take(Math.Max(1, openOrders.Count / 2)).Select(w => new
        {
            workOrderId = w.Id,
            vendorStatus = "PartsReceived",
            estimatedCompletionDate = DateTime.UtcNow.AddDays(rng.Next(1, 5)),
            vendorNotes = "Parts sourced and delivery confirmed."
        }).ToList();

        // Apply status transitions for orders that now have parts
        foreach (var update in updates)
        {
            var wo = openOrders.First(w => w.Id == update.workOrderId);
            if (wo.Status == WorkOrderStatus.WaitingForParts)
                wo.Status = WorkOrderStatus.InProgress;
        }
        await _context.SaveChangesAsync(cancellationToken);

        var payload = JsonSerializer.Serialize(updates);
        _logger.LogInformation("VendorRepair import: processed {Count} repair status updates.", updates.Count);

        return new ConnectorResult(true, payload, updates.Count, null);
    }

    public async Task<ConnectorResult> ExportAsync(CancellationToken cancellationToken = default)
    {
        if (_simulateFailure)
            return new ConnectorResult(false, string.Empty, 0, "Vendor portal export returned malformed response.");

        var orders = await _context.WorkOrders
            .AsNoTracking()
            .Where(w => w.Status != WorkOrderStatus.Completed && w.Status != WorkOrderStatus.Cancelled)
            .Select(w => new { w.Id, w.Title, w.Status, w.Priority, w.AssignedUserId })
            .ToListAsync(cancellationToken);

        var payload = JsonSerializer.Serialize(orders);
        return new ConnectorResult(true, payload, orders.Count, null);
    }
}
