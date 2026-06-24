using OpenFleet.Domain.Enums;

namespace OpenFleet.Domain.Entities;

public class WorkOrder : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public WorkOrderStatus Status { get; set; } = WorkOrderStatus.Open;
    public WorkOrderPriority Priority { get; set; } = WorkOrderPriority.Medium;
    public Guid? VehicleId { get; set; }
    public Guid? AssetId { get; set; }
    public Guid? AssignedUserId { get; set; }
    public decimal LaborHours { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }

    public Vehicle? Vehicle { get; set; }
    public Asset? Asset { get; set; }
    public User? AssignedUser { get; set; }
    public MaintenanceRecord? MaintenanceRecord { get; set; }
    public ICollection<WorkOrderNote> Notes { get; set; } = new List<WorkOrderNote>();
}
