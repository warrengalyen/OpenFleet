namespace OpenFleet.Application.Reports.Models;

public sealed record VehicleMaintenanceHistoryPdfModel(
    Guid Id,
    string OrganizationName,
    string YearMakeModel,
    string LicensePlate,
    string Vin,
    int Mileage,
    string Status,
    DateTimeOffset GeneratedAt,
    IReadOnlyList<MaintenanceTimelinePdfItem> History,
    IReadOnlyList<MaintenanceTimelinePdfItem> Upcoming);
