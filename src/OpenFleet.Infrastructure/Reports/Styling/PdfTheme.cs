using QuestPDF.Helpers;

namespace OpenFleet.Infrastructure.Reports.Styling;

public sealed class PdfTheme
{
    public string PrimaryColor { get; init; } = Colors.Blue.Darken2;
    public string MutedColor { get; init; } = Colors.Grey.Darken1;
    public string BorderColor { get; init; } = Colors.Grey.Lighten2;
    public string EmptyStateColor { get; init; } = Colors.Grey.Medium;

    public float PageMargin { get; init; } = 40;
    public float SectionSpacing { get; init; } = 16;
    public float RowSpacing { get; init; } = 6;

    public float OrganizationFontSize { get; init; } = 18;
    public float TitleFontSize { get; init; } = 16;
    public float SectionFontSize { get; init; } = 12;
    public float BodyFontSize { get; init; } = 10;
    public float SmallFontSize { get; init; } = 8;

    public static PdfTheme Default { get; } = new();
}
