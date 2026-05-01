using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.DTOs;

public record AuditLogResponse(
    Guid Id,
    AuditAction Action,
    string EntityType,
    Guid? EntityId,
    string? ChangedBy,
    string? OldValue,
    string? NewValue,
    string? Notes,
    DateTime CreatedAt
);

public record AuditHistoryFilter(
    AuditAction? Action,
    Guid? EntityId,
    string? EntityType,
    DateTime? DateFrom,
    DateTime? DateTo,
    int Page = 1,
    int PageSize = 50
);
