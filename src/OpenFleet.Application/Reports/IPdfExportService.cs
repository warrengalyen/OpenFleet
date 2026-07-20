namespace OpenFleet.Application.Reports;

public interface IPdfExportService
{
    Task<PdfExportResult?> GenerateWorkOrderAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<PdfExportResult?> GenerateVehicleMaintenanceHistoryAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}
