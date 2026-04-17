namespace OpenFleet.Domain.Entities;

public class MaintenanceRecord : BaseEntity
{
    public Guid WorkOrderId { get; set; }
    public DateTime PerformedAt { get; set; }
    public int OdometerReading { get; set; }
    public string Notes { get; set; } = string.Empty;

    public WorkOrder WorkOrder { get; set; } = null!;
}
