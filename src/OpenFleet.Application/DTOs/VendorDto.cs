namespace OpenFleet.Application.DTOs;

public record CreateVendorRequest(
    string Name,
    string ContactName,
    string Email,
    string Phone,
    string Address
);

public record UpdateVendorRequest(
    string? Name,
    string? ContactName,
    string? Email,
    string? Phone,
    string? Address
);

public record VendorResponse(
    Guid Id,
    string Name,
    string ContactName,
    string Email,
    string Phone,
    string Address,
    int PartCount,
    bool HasAssignedParts,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record VendorPartSummary(
    Guid Id,
    string Name,
    string PartNumber,
    int QuantityOnHand,
    bool IsLowStock
);

public record VendorDetailResponse(
    Guid Id,
    string Name,
    string ContactName,
    string Email,
    string Phone,
    string Address,
    int PartCount,
    bool HasAssignedParts,
    IReadOnlyList<VendorPartSummary> Parts,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
