using OpenFleet.Domain.Enums;

namespace OpenFleet.Domain.Entities;

public class Asset : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string AssetTag { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public AssetCondition Condition { get; set; } = AssetCondition.Good;
    public AssetStatus Status { get; set; } = AssetStatus.Available;
    public DateTime PurchaseDate { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid? VehicleId { get; set; }

    public Department? Department { get; set; }
    public Vehicle? Vehicle { get; set; }
}
