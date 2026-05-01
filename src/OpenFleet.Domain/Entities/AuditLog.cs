using OpenFleet.Domain.Enums;

namespace OpenFleet.Domain.Entities;

public class AuditLog : BaseEntity
{
    public AuditAction Action { get; set; }

    /// <summary>Discriminator for the affected entity type, e.g. "Vehicle", "WorkOrder".</summary>
    public string EntityType { get; set; } = string.Empty;

    public Guid? EntityId { get; set; }

    /// <summary>Email of the authenticated user who triggered the change.</summary>
    public string? ChangedBy { get; set; }

    /// <summary>JSON snapshot of the entity state before the change.</summary>
    public string? OldValue { get; set; }

    /// <summary>JSON snapshot of the entity state after the change.</summary>
    public string? NewValue { get; set; }

    public string? Notes { get; set; }
}
