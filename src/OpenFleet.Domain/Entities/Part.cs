namespace OpenFleet.Domain.Entities;

public class Part : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string PartNumber { get; set; } = string.Empty;
    public Guid VendorId { get; set; }
    public int QuantityOnHand { get; set; }
    public decimal UnitCost { get; set; }

    public Vendor Vendor { get; set; } = null!;
}
