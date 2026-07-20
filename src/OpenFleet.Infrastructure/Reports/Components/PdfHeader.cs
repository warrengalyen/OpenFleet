using OpenFleet.Infrastructure.Reports.Styling;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace OpenFleet.Infrastructure.Reports.Components;

public sealed class PdfHeader : IComponent
{
    private readonly string _organizationName;
    private readonly string _reportTitle;
    private readonly string? _reference;
    private readonly DateTimeOffset _generatedAt;
    private readonly PdfTheme _theme;

    public PdfHeader(
        string organizationName,
        string reportTitle,
        string? reference,
        DateTimeOffset generatedAt,
        PdfTheme theme)
    {
        _organizationName = organizationName;
        _reportTitle = reportTitle;
        _reference = reference;
        _generatedAt = generatedAt;
        _theme = theme;
    }

    public void Compose(IContainer container)
    {
        container.Column(column =>
        {
            column.Item().Text(_organizationName)
                .FontSize(_theme.OrganizationFontSize)
                .SemiBold()
                .FontColor(_theme.PrimaryColor);

            column.Item().PaddingTop(4).Text(_reportTitle)
                .FontSize(_theme.TitleFontSize)
                .SemiBold();

            if (!string.IsNullOrWhiteSpace(_reference))
            {
                column.Item().PaddingTop(2).Text(_reference)
                    .FontSize(_theme.BodyFontSize)
                    .FontColor(_theme.MutedColor);
            }

            column.Item().PaddingTop(2).Text($"Generated {_generatedAt.UtcDateTime:yyyy-MM-dd HH:mm} UTC")
                .FontSize(_theme.SmallFontSize)
                .FontColor(_theme.MutedColor);

            column.Item().PaddingTop(8).LineHorizontal(1).LineColor(_theme.BorderColor);
        });
    }
}
