using OpenFleet.Infrastructure.Reports.Styling;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace OpenFleet.Infrastructure.Reports.Components;

public sealed class SectionHeading : IComponent
{
    private readonly string _title;
    private readonly PdfTheme _theme;

    public SectionHeading(string title, PdfTheme theme)
    {
        _title = title;
        _theme = theme;
    }

    public void Compose(IContainer container)
    {
        container.PaddingBottom(6).Text(_title)
            .FontSize(_theme.SectionFontSize)
            .SemiBold()
            .FontColor(_theme.PrimaryColor);
    }
}
