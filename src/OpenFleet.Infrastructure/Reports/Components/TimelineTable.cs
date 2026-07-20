using OpenFleet.Application.Reports.Models;
using OpenFleet.Infrastructure.Reports.Styling;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace OpenFleet.Infrastructure.Reports.Components;

public sealed class TimelineTable : IComponent
{
    private readonly IReadOnlyList<MaintenanceTimelinePdfItem> _items;
    private readonly PdfTheme _theme;
    private readonly string _emptyMessage;

    public TimelineTable(
        IReadOnlyList<MaintenanceTimelinePdfItem> items,
        PdfTheme theme,
        string emptyMessage = "No items.")
    {
        _items = items;
        _theme = theme;
        _emptyMessage = emptyMessage;
    }

    public void Compose(IContainer container)
    {
        if (_items.Count == 0)
        {
            container.Text(_emptyMessage)
                .FontSize(_theme.BodyFontSize)
                .FontColor(_theme.EmptyStateColor)
                .Italic();
            return;
        }

        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.ConstantColumn(90);
                columns.ConstantColumn(80);
                columns.RelativeColumn(2);
                columns.ConstantColumn(70);
                columns.RelativeColumn(2);
            });

            table.Header(header =>
            {
                header.Cell().Element(HeaderCell).Text("Date");
                header.Cell().Element(HeaderCell).Text("Type");
                header.Cell().Element(HeaderCell).Text("Title");
                header.Cell().Element(HeaderCell).Text("Status");
                header.Cell().Element(HeaderCell).Text("Summary");
            });

            foreach (var item in _items)
            {
                table.Cell().Element(BodyCell).Text(item.Date.UtcDateTime.ToString("yyyy-MM-dd"));
                table.Cell().Element(BodyCell).Text(item.Type.ToString());
                table.Cell().Element(BodyCell).Text(item.Title);
                table.Cell().Element(BodyCell).Text(item.Status ?? "—");
                table.Cell().Element(BodyCell).Text(item.Summary ?? "—");
            }
        });

        IContainer HeaderCell(IContainer cell) =>
            cell.DefaultTextStyle(x => x.SemiBold().FontSize(_theme.SmallFontSize).FontColor(_theme.PrimaryColor))
                .PaddingVertical(4)
                .BorderBottom(1)
                .BorderColor(_theme.BorderColor);

        IContainer BodyCell(IContainer cell) =>
            cell.DefaultTextStyle(x => x.FontSize(_theme.SmallFontSize).FontColor(Colors.Black))
                .PaddingVertical(4)
                .BorderBottom(0.5f)
                .BorderColor(_theme.BorderColor);
    }
}
