namespace OpenFleet.Application.Reports;

public sealed record PdfExportResult(
    byte[] Content,
    string FileName,
    string ContentType = "application/pdf");
