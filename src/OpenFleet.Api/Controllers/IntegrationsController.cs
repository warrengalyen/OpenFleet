using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;
using OpenFleet.Application.Services;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Api.Controllers;

[ApiController]
[Route("api/integrations")]
[Produces("application/json")]
[Authorize(Roles = AuthorizationPolicies.AnyAuthenticated)]
public class IntegrationsController : ControllerBase
{
    private readonly IntegrationLogService _logService;
    private readonly IEnumerable<IExternalIntegrationConnector> _connectors;
    private readonly ILogger<IntegrationsController> _logger;

    public IntegrationsController(
        IntegrationLogService logService,
        IEnumerable<IExternalIntegrationConnector> connectors,
        ILogger<IntegrationsController> logger)
    {
        _logService = logService;
        _connectors = connectors;
        _logger = logger;
    }

    /// <summary>List integration history with optional filtering and pagination.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IntegrationHistoryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory(
        [FromQuery] IntegrationSource? source,
        [FromQuery] IntegrationStatus? status,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var filter = new IntegrationHistoryFilter(source, status, dateFrom, dateTo, page, pageSize);
        var result = await _logService.GetHistoryAsync(filter, cancellationToken);
        return Ok(result);
    }

    /// <summary>Get a single integration log entry by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(IntegrationLogResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _logService.GetByIdAsync(id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Manually trigger an import sync for a specific integration source.
    /// Creates a log entry and runs the connector immediately.
    /// </summary>
    [HttpPost("sync/{source}")]
    [Authorize(Roles = AuthorizationPolicies.FleetManagerOrAbove)]
    [ProducesResponseType(typeof(IntegrationLogResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> TriggerSync(
        IntegrationSource source,
        CancellationToken cancellationToken)
    {
        var connector = _connectors.FirstOrDefault(c => c.Source == source);
        if (connector is null)
            return NotFound(new { message = $"No connector registered for source '{source}'." });

        var log = await _logService.CreateAsync(source, IntegrationDirection.Import, cancellationToken);

        try
        {
            var result = await connector.ImportAsync(cancellationToken);

            if (result.Success)
                await _logService.RecordSuccessAsync(log.Id, result.Payload, result.RecordsProcessed, cancellationToken);
            else
                await _logService.RecordFailureAsync(log.Id, result.ErrorMessage ?? "Connector returned failure.", cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sync for {Source} threw an exception.", source);
            await _logService.RecordFailureAsync(log.Id, $"{ex.GetType().Name}: {ex.Message}", cancellationToken);
        }

        var response = await _logService.GetByIdAsync(log.Id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Force-retry a failed integration log entry immediately, regardless of the scheduled retry time.
    /// </summary>
    [HttpPost("retry/{id:guid}")]
    [Authorize(Roles = AuthorizationPolicies.FleetManagerOrAbove)]
    [ProducesResponseType(typeof(IntegrationLogResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RetrySync(Guid id, CancellationToken cancellationToken)
    {
        var existing = await _logService.GetByIdAsync(id, cancellationToken);
        if (existing is null)
            return NotFound(new { message = $"Integration log {id} not found." });

        if (existing.Status == IntegrationStatus.Success)
            return Conflict(new { message = "Cannot retry a log entry that already succeeded." });

        if (existing.Status == IntegrationStatus.Pending)
            return Conflict(new { message = "Log entry is still in Pending state - sync already in progress." });

        var connector = _connectors.FirstOrDefault(c => c.Source == existing.Source);
        if (connector is null)
            return NotFound(new { message = $"No connector registered for source '{existing.Source}'." });

        try
        {
            var result = await connector.ImportAsync(cancellationToken);

            if (result.Success)
                await _logService.RecordSuccessAsync(id, result.Payload, result.RecordsProcessed, cancellationToken);
            else
                await _logService.RecordFailureAsync(id, result.ErrorMessage ?? "Connector returned failure.", cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Retry for log {Id} ({Source}) threw an exception.", id, existing.Source);
            await _logService.RecordFailureAsync(id, $"{ex.GetType().Name}: {ex.Message}", cancellationToken);
        }

        var response = await _logService.GetByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Run the export connector for a specific source and return the JSON payload directly.
    /// Useful for diagnosing what data would be sent to the external system.
    /// </summary>
    [HttpGet("export/{source}")]
    [ProducesResponseType(typeof(IntegrationLogResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Export(IntegrationSource source, CancellationToken cancellationToken)
    {
        var connector = _connectors.FirstOrDefault(c => c.Source == source);
        if (connector is null)
            return NotFound(new { message = $"No connector registered for source '{source}'." });

        var log = await _logService.CreateAsync(source, IntegrationDirection.Export, cancellationToken);

        try
        {
            var result = await connector.ExportAsync(cancellationToken);

            if (result.Success)
                await _logService.RecordSuccessAsync(log.Id, result.Payload, result.RecordsProcessed, cancellationToken);
            else
                await _logService.RecordFailureAsync(log.Id, result.ErrorMessage ?? "Export failed.", cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Export for {Source} threw an exception.", source);
            await _logService.RecordFailureAsync(log.Id, $"{ex.GetType().Name}: {ex.Message}", cancellationToken);
        }

        var response = await _logService.GetByIdAsync(log.Id, cancellationToken);
        return Ok(response);
    }
}
