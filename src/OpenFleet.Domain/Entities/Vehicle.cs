using OpenFleet.Domain.Enums;

namespace OpenFleet.Domain.Entities;

public class Vehicle : BaseEntity
{
    public string VIN { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public VehicleStatus Status { get; set; } = VehicleStatus.Active;
    public Guid DepartmentId { get; set; }

    public Department Department { get; set; } = null!;
    public ICollection<Asset> Assets { get; set; } = new List<Asset>();
    public ICollection<WorkOrder> WorkOrders { get; set; } = new List<WorkOrder>();
    public ICollection<Inspection> Inspections { get; set; } = new List<Inspection>();
}
