using OpenFleet.Domain.Enums;

namespace OpenFleet.Domain.Entities;

public class IntegrationLog : BaseEntity
{
    public IntegrationSource Source { get; set; }
    public IntegrationDirection Direction { get; set; }
    public IntegrationStatus Status { get; set; } = IntegrationStatus.Pending;

    /// <summary>JSON payload exchanged with the external system.</summary>
    public string? Payload { get; set; }

    public string? ErrorMessage { get; set; }

    /// <summary>Total number of sync attempts made for this log entry.</summary>
    public int AttemptCount { get; set; } = 0;

    public DateTime? LastAttemptAt { get; set; }

    /// <summary>When the next retry should be attempted (null when not scheduled).</summary>
    public DateTime? NextRetryAt { get; set; }

    public int? RecordsProcessed { get; set; }
}
