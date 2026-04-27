namespace OpenFleet.Domain.Entities;

public class MaintenanceSchedule : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid? VehicleId { get; set; }
    public Guid? AssetId { get; set; }
    public int? MileageInterval { get; set; }
    public int? DayInterval { get; set; }
    public DateTime? LastPerformedAt { get; set; }
    public int? LastPerformedMileage { get; set; }
    public bool IsActive { get; set; } = true;

    public Vehicle? Vehicle { get; set; }
    public Asset? Asset { get; set; }
}
