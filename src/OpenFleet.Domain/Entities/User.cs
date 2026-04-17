using OpenFleet.Domain.Enums;

namespace OpenFleet.Domain.Entities;

public class User : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public Guid DepartmentId { get; set; }

    public Department Department { get; set; } = null!;
    public ICollection<WorkOrder> AssignedWorkOrders { get; set; } = new List<WorkOrder>();
    public ICollection<Inspection> Inspections { get; set; } = new List<Inspection>();
}
