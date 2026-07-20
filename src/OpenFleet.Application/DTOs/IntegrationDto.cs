using OpenFleet.Domain.Enums;

namespace OpenFleet.Application.DTOs;

public record IntegrationLogResponse(
    Guid Id,
    IntegrationSource Source,
    IntegrationDirection Direction,
    IntegrationStatus Status,
    string? Payload,
    string? ErrorMessage,
    int AttemptCount,
    DateTime? LastAttemptAt,
    DateTime? NextRetryAt,
    int? RecordsProcessed,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record TriggerSyncRequest(
    bool ForceRetry = false
);

public record IntegrationHistoryFilter(
    IntegrationSource? Source,
    IntegrationStatus? Status,
    DateTime? DateFrom,
    DateTime? DateTo,
    int Page = 1,
    int PageSize = 50
);
