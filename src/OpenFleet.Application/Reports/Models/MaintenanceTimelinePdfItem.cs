namespace OpenFleet.Application.Reports.Models;

public sealed record MaintenanceTimelinePdfItem(
    DateTimeOffset Date,
    MaintenanceTimelineItemType Type,
    string Title,
    string? Status,
    string? Summary,
    string? ReferenceNumber);
