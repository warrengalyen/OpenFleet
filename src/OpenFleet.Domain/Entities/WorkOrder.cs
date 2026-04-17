using OpenFleet.Domain.Enums;

namespace OpenFleet.Domain.Entities;

public class WorkOrder : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public WorkOrderStatus Status { get; set; } = WorkOrderStatus.Open;
    public WorkOrderPriority Priority { get; set; } = WorkOrderPriority.Medium;
    public Guid VehicleId { get; set; }
    public Guid? AssignedUserId { get; set; }

    public Vehicle Vehicle { get; set; } = null!;
    public User? AssignedUser { get; set; }
    public MaintenanceRecord? MaintenanceRecord { get; set; }
}
