namespace OpenFleet.Domain.Entities;

public class Inspection : BaseEntity
{
    public Guid VehicleId { get; set; }
    public Guid InspectorUserId { get; set; }
    public DateTime InspectedAt { get; set; }
    public bool Passed { get; set; }
    public string Notes { get; set; } = string.Empty;

    public Vehicle Vehicle { get; set; } = null!;
    public User InspectorUser { get; set; } = null!;
}
