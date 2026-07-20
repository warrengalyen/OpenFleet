using OpenFleet.Application.Reports.Models;
using OpenFleet.Infrastructure.Reports.Components;
using OpenFleet.Infrastructure.Reports.Styling;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace OpenFleet.Infrastructure.Reports.Documents;

public sealed class VehicleMaintenanceHistoryPdfDocument : IDocument
{
    private readonly VehicleMaintenanceHistoryPdfModel _model;
    private readonly PdfTheme _theme;

    public VehicleMaintenanceHistoryPdfDocument(VehicleMaintenanceHistoryPdfModel model, PdfTheme theme)
    {
        _model = model;
        _theme = theme;
    }

    public DocumentMetadata GetMetadata() => new()
    {
        Title = $"Maintenance History — {_model.YearMakeModel}",
        Author = _model.OrganizationName,
        Subject = "Vehicle maintenance history export",
    };

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Margin(_theme.PageMargin);
            page.Size(PageSizes.Letter);
            page.DefaultTextStyle(x => x.FontSize(_theme.BodyFontSize));

            page.Header().Component(new PdfHeader(
                _model.OrganizationName,
                "Vehicle Maintenance History",
                $"{_model.YearMakeModel} ({_model.LicensePlate})",
                _model.GeneratedAt,
                _theme));

            page.Content().PaddingVertical(_theme.SectionSpacing).Column(column =>
            {
                column.Spacing(_theme.SectionSpacing);

                column.Item().Component(new SectionHeading("Vehicle", _theme));
                column.Item().Component(new DetailTable(
                [
                    ("Vehicle", _model.YearMakeModel),
                    ("License plate", _model.LicensePlate),
                    ("VIN", _model.Vin),
                    ("Mileage", $"{_model.Mileage:N0} mi"),
                    ("Status", _model.Status),
                ], _theme));

                column.Item().Component(new SectionHeading("Maintenance History", _theme));
                column.Item().Component(new TimelineTable(
                    _model.History,
                    _theme,
                    "No maintenance history."));

                column.Item().Component(new SectionHeading("Upcoming Maintenance", _theme));
                column.Item().Component(new TimelineTable(
                    _model.Upcoming,
                    _theme,
                    "No upcoming maintenance."));
            });

            page.Footer().Component(new PdfFooter(_theme));
        });
    }
}
