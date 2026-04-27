using OpenFleet.Domain.Enums;

namespace OpenFleet.Domain.Entities;

public class Inspection : BaseEntity
{
    public Guid? VehicleId { get; set; }
    public Guid? AssetId { get; set; }
    public Guid InspectorUserId { get; set; }
    public DateTime InspectedAt { get; set; }
    public InspectionStatus Status { get; set; } = InspectionStatus.Passed;
    public string Notes { get; set; } = string.Empty;
    public Guid? GeneratedWorkOrderId { get; set; }

    public Vehicle? Vehicle { get; set; }
    public Asset? Asset { get; set; }
    public User InspectorUser { get; set; } = null!;
    public WorkOrder? GeneratedWorkOrder { get; set; }
}
