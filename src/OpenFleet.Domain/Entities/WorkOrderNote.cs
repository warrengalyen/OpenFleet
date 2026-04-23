namespace OpenFleet.Domain.Entities;

public class WorkOrderNote : BaseEntity
{
    public Guid WorkOrderId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;

    public WorkOrder WorkOrder { get; set; } = null!;
}
