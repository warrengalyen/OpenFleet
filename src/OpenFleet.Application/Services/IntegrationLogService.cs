using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.Services;

public class IntegrationLogService
{
    private readonly IOpenFleetDbContext _context;
    private readonly ILogger<IntegrationLogService> _logger;
    private readonly AuditService _auditService;

    // Exponential backoff delays (in minutes) indexed by attempt number (1-based).
    // Attempt 1 → 2 min, attempt 2 → 8 min, attempt 3 → max/failed
    private static readonly int[] BackoffMinutes = [2, 8, 30];
    private const int MaxRetries = 3;

    public IntegrationLogService(
        IOpenFleetDbContext context,
        ILogger<IntegrationLogService> logger,
        AuditService auditService)
    {
        _context = context;
        _logger = logger;
        _auditService = auditService;
    }

    /// <summary>Create a new Pending log entry before a sync attempt begins.</summary>
    public async Task<IntegrationLog> CreateAsync(
        IntegrationSource source,
        IntegrationDirection direction,
        CancellationToken cancellationToken = default)
    {
        var log = new IntegrationLog
        {
            Source = source,
            Direction = direction,
            Status = IntegrationStatus.Pending
        };

        _context.IntegrationLogs.Add(log);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Integration log {Id} created for {Source} {Direction}.",
            log.Id, source, direction);

        return log;
    }

    /// <summary>Mark a log entry as successful after the connector completes.</summary>
    public async Task RecordSuccessAsync(
        Guid id,
        string payload,
        int recordsProcessed,
        CancellationToken cancellationToken = default)
    {
        var log = await _context.IntegrationLogs
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        if (log is null)
        {
            _logger.LogWarning("RecordSuccess called for unknown log {Id}.", id);
            return;
        }

        log.Status = IntegrationStatus.Success;
        log.Payload = payload;
        log.RecordsProcessed = recordsProcessed;
        log.AttemptCount++;
        log.LastAttemptAt = DateTime.UtcNow;
        log.NextRetryAt = null;
        log.ErrorMessage = null;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Integration log {Id} ({Source}) succeeded. Records processed: {Count}.",
            id, log.Source, recordsProcessed);
    }

    /// <summary>
    /// Mark a log entry as failed. If under the retry limit, schedule a retry with
    /// exponential backoff and set status to Retrying; otherwise set to Failed permanently.
    /// </summary>
    public async Task RecordFailureAsync(
        Guid id,
        string errorMessage,
        CancellationToken cancellationToken = default)
    {
        var log = await _context.IntegrationLogs
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        if (log is null)
        {
            _logger.LogWarning("RecordFailure called for unknown log {Id}.", id);
            return;
        }

        log.AttemptCount++;
        log.LastAttemptAt = DateTime.UtcNow;
        log.ErrorMessage = errorMessage;

        if (log.AttemptCount < MaxRetries)
        {
            var backoffMinutes = BackoffMinutes[log.AttemptCount - 1];
            log.Status = IntegrationStatus.Retrying;
            log.NextRetryAt = DateTime.UtcNow.AddMinutes(backoffMinutes);

            _logger.LogWarning(
                "Integration log {Id} ({Source}) failed on attempt {Attempt}. " +
                "Retry scheduled in {Minutes} minutes at {NextRetry:u}. Error: {Error}",
                id, log.Source, log.AttemptCount, backoffMinutes, log.NextRetryAt, errorMessage);
        }
        else
        {
            log.Status = IntegrationStatus.Failed;
            log.NextRetryAt = null;

            _logger.LogError(
                "Integration log {Id} ({Source}) permanently failed after {Attempts} attempts. Error: {Error}",
                id, log.Source, log.AttemptCount, errorMessage);

            await _context.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync(
                AuditAction.IntegrationSyncFailed,
                "IntegrationLog",
                log.Id,
                notes: $"Source={log.Source} permanently failed after {log.AttemptCount} attempts. Error: {errorMessage}",
                cancellationToken: cancellationToken);

            return;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Retrieve all logs that are due for a retry.</summary>
    public async Task<IReadOnlyList<IntegrationLog>> GetPendingRetriesAsync(
        DateTime now,
        CancellationToken cancellationToken = default)
    {
        return await _context.IntegrationLogs
            .Where(l => l.Status == IntegrationStatus.Retrying && l.NextRetryAt <= now)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IntegrationLogResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var log = await _context.IntegrationLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        return log is null ? null : ToResponse(log);
    }

    public async Task<IntegrationHistoryResponse> GetHistoryAsync(
        IntegrationHistoryFilter filter,
        CancellationToken cancellationToken = default)
    {
        var query = _context.IntegrationLogs.AsNoTracking().AsQueryable();

        if (filter.Source.HasValue) query = query.Where(l => l.Source == filter.Source.Value);
        if (filter.Status.HasValue) query = query.Where(l => l.Status == filter.Status.Value);
        if (filter.DateFrom.HasValue) query = query.Where(l => l.CreatedAt >= filter.DateFrom.Value);
        if (filter.DateTo.HasValue) query = query.Where(l => l.CreatedAt <= filter.DateTo.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(l => ToResponse(l))
            .ToListAsync(cancellationToken);

        return new IntegrationHistoryResponse(items, totalCount, filter.Page, filter.PageSize);
    }

    public static IntegrationLogResponse ToResponse(IntegrationLog l) => new(
        l.Id,
        l.Source,
        l.Direction,
        l.Status,
        l.Payload,
        l.ErrorMessage,
        l.AttemptCount,
        l.LastAttemptAt,
        l.NextRetryAt,
        l.RecordsProcessed,
        l.CreatedAt,
        l.UpdatedAt
    );
}
