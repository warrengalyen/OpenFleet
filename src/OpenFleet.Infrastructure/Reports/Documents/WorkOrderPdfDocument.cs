using OpenFleet.Application.Reports.Models;
using OpenFleet.Infrastructure.Reports.Components;
using OpenFleet.Infrastructure.Reports.Styling;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace OpenFleet.Infrastructure.Reports.Documents;

public sealed class WorkOrderPdfDocument : IDocument
{
    private readonly WorkOrderPdfModel _model;
    private readonly PdfTheme _theme;

    public WorkOrderPdfDocument(WorkOrderPdfModel model, PdfTheme theme)
    {
        _model = model;
        _theme = theme;
    }

    public DocumentMetadata GetMetadata() => new()
    {
        Title = $"Work Order — {_model.Title}",
        Author = _model.OrganizationName,
        Subject = "Work order detail export",
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
                "Work Order Detail",
                _model.Title,
                _model.GeneratedAt,
                _theme));

            page.Content().PaddingVertical(_theme.SectionSpacing).Column(column =>
            {
                column.Spacing(_theme.SectionSpacing);

                column.Item().Component(new SectionHeading("Details", _theme));
                column.Item().Component(new DetailTable(
                [
                    ("Status", _model.Status),
                    ("Priority", _model.Priority),
                    ("Vehicle", _model.VehicleDescription ?? "—"),
                    ("Asset", _model.AssetDescription ?? "—"),
                    ("Assignee", _model.AssignedUserName ?? "—"),
                    ("Labor hours", _model.LaborHours.ToString("0.##")),
                    ("Created", FormatDate(_model.CreatedAt)),
                    ("Due", FormatOptionalDate(_model.DueDate)),
                    ("Completed", FormatOptionalDate(_model.CompletedAt)),
                ], _theme));

                if (!string.IsNullOrWhiteSpace(_model.Description))
                {
                    column.Item().Component(new SectionHeading("Description", _theme));
                    column.Item().Text(_model.Description).FontSize(_theme.BodyFontSize);
                }

                if (!string.IsNullOrWhiteSpace(_model.MaintenanceRecordSummary))
                {
                    column.Item().Component(new SectionHeading("Maintenance Record", _theme));
                    column.Item().Text(_model.MaintenanceRecordSummary).FontSize(_theme.BodyFontSize);
                }

                column.Item().Component(new SectionHeading("Notes", _theme));
                if (_model.Notes.Count == 0)
                {
                    column.Item().Text("No notes.")
                        .FontSize(_theme.BodyFontSize)
                        .FontColor(_theme.EmptyStateColor)
                        .Italic();
                }
                else
                {
                    foreach (var note in _model.Notes)
                    {
                        column.Item().PaddingBottom(8).Column(noteCol =>
                        {
                            noteCol.Item().Text($"{FormatDate(note.CreatedAt)} — {note.AuthorName}")
                                .FontSize(_theme.SmallFontSize)
                                .FontColor(_theme.MutedColor)
                                .SemiBold();
                            noteCol.Item().Text(note.Content).FontSize(_theme.BodyFontSize);
                        });
                    }
                }
            });

            page.Footer().Component(new PdfFooter(_theme));
        });
    }

    private static string FormatDate(DateTimeOffset value) =>
        value.UtcDateTime.ToString("yyyy-MM-dd HH:mm") + " UTC";

    private static string FormatOptionalDate(DateTimeOffset? value) =>
        value is null ? "—" : FormatDate(value.Value);
}
