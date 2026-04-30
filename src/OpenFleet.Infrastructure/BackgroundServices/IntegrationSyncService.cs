using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenFleet.Application.Interfaces;
using OpenFleet.Application.Services;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Infrastructure.BackgroundServices;

/// <summary>
/// Periodic background service that runs all external integration connectors on a fixed interval
/// and handles retry logic for previously failed sync attempts.
/// </summary>
public class IntegrationSyncService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<IntegrationSyncService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(30);

    public IntegrationSyncService(
        IServiceScopeFactory scopeFactory,
        ILogger<IntegrationSyncService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("IntegrationSyncService started. Interval: {Interval}", _interval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunSyncCycleAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Unhandled error in IntegrationSyncService cycle.");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task RunSyncCycleAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Integration sync cycle starting at {Time:u}.", DateTime.UtcNow);

        using var scope = _scopeFactory.CreateScope();
        var connectors = scope.ServiceProvider.GetRequiredService<IEnumerable<IExternalIntegrationConnector>>();
        var logService = scope.ServiceProvider.GetRequiredService<IntegrationLogService>();

        // First, process any pending retries
        var pendingRetries = await logService.GetPendingRetriesAsync(DateTime.UtcNow, cancellationToken);
        foreach (var retryLog in pendingRetries)
        {
            var connector = connectors.FirstOrDefault(c => c.Source == retryLog.Source);
            if (connector is null) continue;

            _logger.LogInformation(
                "Retrying integration log {Id} for {Source} (attempt {Attempt}).",
                retryLog.Id, retryLog.Source, retryLog.AttemptCount + 1);

            await ExecuteConnectorAsync(connector, retryLog.Id, logService, cancellationToken);
        }

        // Then run full sync for each connector
        foreach (var connector in connectors)
        {
            var log = await logService.CreateAsync(connector.Source, IntegrationDirection.Import, cancellationToken);
            await ExecuteConnectorAsync(connector, log.Id, logService, cancellationToken);
        }

        _logger.LogInformation("Integration sync cycle completed at {Time:u}.", DateTime.UtcNow);
    }

    private async Task ExecuteConnectorAsync(
        IExternalIntegrationConnector connector,
        Guid logId,
        IntegrationLogService logService,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await connector.ImportAsync(cancellationToken);

            if (result.Success)
            {
                await logService.RecordSuccessAsync(logId, result.Payload, result.RecordsProcessed, cancellationToken);
                _logger.LogInformation(
                    "{Source} sync succeeded. Records: {Count}.",
                    connector.Source, result.RecordsProcessed);
            }
            else
            {
                await logService.RecordFailureAsync(logId, result.ErrorMessage ?? "Unknown error", cancellationToken);
                _logger.LogWarning(
                    "{Source} sync reported failure: {Error}.",
                    connector.Source, result.ErrorMessage);
            }
        }
        catch (Exception ex)
        {
            var error = $"{ex.GetType().Name}: {ex.Message}";
            await logService.RecordFailureAsync(logId, error, cancellationToken);
            _logger.LogError(ex, "{Source} sync threw an exception.", connector.Source);
        }
    }
}
