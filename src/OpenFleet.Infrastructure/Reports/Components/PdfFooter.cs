using OpenFleet.Infrastructure.Reports.Styling;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace OpenFleet.Infrastructure.Reports.Components;

public sealed class PdfFooter : IComponent
{
    private readonly PdfTheme _theme;

    public PdfFooter(PdfTheme theme)
    {
        _theme = theme;
    }

    public void Compose(IContainer container)
    {
        container.AlignCenter().Text(text =>
        {
            text.DefaultTextStyle(x => x.FontSize(_theme.SmallFontSize).FontColor(_theme.MutedColor));
            text.Span("Page ");
            text.CurrentPageNumber();
            text.Span(" of ");
            text.TotalPages();
        });
    }
}
