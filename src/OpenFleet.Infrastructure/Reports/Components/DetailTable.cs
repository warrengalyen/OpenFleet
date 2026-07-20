using OpenFleet.Infrastructure.Reports.Styling;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace OpenFleet.Infrastructure.Reports.Components;

public sealed class DetailTable : IComponent
{
    private readonly IReadOnlyList<(string Label, string Value)> _rows;
    private readonly PdfTheme _theme;
    private readonly string? _emptyMessage;

    public DetailTable(
        IReadOnlyList<(string Label, string Value)> rows,
        PdfTheme theme,
        string? emptyMessage = null)
    {
        _rows = rows;
        _theme = theme;
        _emptyMessage = emptyMessage;
    }

    public void Compose(IContainer container)
    {
        if (_rows.Count == 0)
        {
            container.Text(_emptyMessage ?? "No details available.")
                .FontSize(_theme.BodyFontSize)
                .FontColor(_theme.EmptyStateColor)
                .Italic();
            return;
        }

        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.ConstantColumn(120);
                columns.RelativeColumn();
            });

            foreach (var (label, value) in _rows)
            {
                table.Cell().PaddingVertical(_theme.RowSpacing / 2).Text(label)
                    .FontSize(_theme.BodyFontSize)
                    .FontColor(_theme.MutedColor);

                table.Cell().PaddingVertical(_theme.RowSpacing / 2).Text(string.IsNullOrWhiteSpace(value) ? "—" : value)
                    .FontSize(_theme.BodyFontSize)
                    .FontColor(Colors.Black);
            }
        });
    }
}
