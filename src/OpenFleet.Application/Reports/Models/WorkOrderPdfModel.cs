namespace OpenFleet.Application.Reports.Models;

public sealed record WorkOrderPdfModel(
    Guid Id,
    string OrganizationName,
    string Title,
    string Description,
    string Status,
    string Priority,
    string? VehicleDescription,
    string? AssetDescription,
    string? AssignedUserName,
    decimal LaborHours,
    DateTimeOffset CreatedAt,
    DateTimeOffset? DueDate,
    DateTimeOffset? CompletedAt,
    DateTimeOffset GeneratedAt,
    IReadOnlyList<WorkOrderNotePdfModel> Notes,
    string? MaintenanceRecordSummary);
