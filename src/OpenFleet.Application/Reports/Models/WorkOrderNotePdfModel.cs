namespace OpenFleet.Application.Reports.Models;

public sealed record WorkOrderNotePdfModel(
    DateTimeOffset CreatedAt,
    string AuthorName,
    string Content);
