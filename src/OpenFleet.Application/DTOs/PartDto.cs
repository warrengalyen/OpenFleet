namespace OpenFleet.Application.DTOs;

public record CreatePartRequest(
    string Name,
    string PartNumber,
    Guid VendorId,
    int QuantityOnHand,
    decimal UnitCost
);

public record UpdatePartRequest(
    string? Name,
    string? PartNumber,
    Guid? VendorId,
    int? QuantityOnHand,
    decimal? UnitCost
);

public record PartResponse(
    Guid Id,
    string Name,
    string PartNumber,
    Guid VendorId,
    string VendorName,
    int QuantityOnHand,
    decimal UnitCost,
    decimal TotalValue,
    bool IsLowStock,
    int LowStockThreshold,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record PartUsageHistoryEntry(
    DateTime OccurredAt,
    string Source,
    int? PreviousQuantity,
    int NewQuantity,
    string? Notes
);
