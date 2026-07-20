using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.Services;

public class AuditService
{
    private readonly IOpenFleetDbContext _context;

    public AuditService(IOpenFleetDbContext context)
    {
        _context = context;
    }

    /// <summary>Persist an audit entry. All parameters after <paramref name="action"/> are optional context.</summary>
    public async Task LogAsync(
        AuditAction action,
        string entityType,
        Guid? entityId = null,
        string? changedBy = null,
        string? oldValue = null,
        string? newValue = null,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        var entry = new AuditLog
        {
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            ChangedBy = changedBy,
            OldValue = oldValue,
            NewValue = newValue,
            Notes = notes
        };

        _context.AuditLogs.Add(entry);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<PagedResult<AuditLogResponse>> GetHistoryAsync(
        AuditHistoryFilter filter,
        CancellationToken cancellationToken = default)
    {
        var query = _context.AuditLogs.AsNoTracking().AsQueryable();

        if (filter.Action.HasValue) query = query.Where(l => l.Action == filter.Action.Value);
        if (filter.EntityId.HasValue) query = query.Where(l => l.EntityId == filter.EntityId.Value);
        if (filter.EntityType is not null) query = query.Where(l => l.EntityType == filter.EntityType);
        if (filter.DateFrom.HasValue) query = query.Where(l => l.CreatedAt >= filter.DateFrom.Value);
        if (filter.DateTo.HasValue) query = query.Where(l => l.CreatedAt <= filter.DateTo.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(l => ToResponse(l))
            .ToListAsync(cancellationToken);

        return PagedResult<AuditLogResponse>.Create(items, totalCount, filter.Page, filter.PageSize);
    }

    public async Task<AuditLogResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var log = await _context.AuditLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        return log is null ? null : ToResponse(log);
    }

    public static AuditLogResponse ToResponse(AuditLog l) => new(
        l.Id, l.Action, l.EntityType, l.EntityId,
        l.ChangedBy, l.OldValue, l.NewValue, l.Notes, l.CreatedAt);
}
