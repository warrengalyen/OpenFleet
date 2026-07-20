using OpenFleet.Application.Reports.Models;
using OpenFleet.Infrastructure.Reports;
using OpenFleet.Infrastructure.Reports.Documents;
using OpenFleet.Infrastructure.Reports.Styling;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace OpenFleet.Tests.Infrastructure;

public class PdfExportUnitTests
{
    public PdfExportUnitTests()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    [Theory]
    [InlineData("Brake Inspection", "Brake-Inspection")]
    [InlineData("8ABC123", "8ABC123")]
    [InlineData("plate/with\\path", "plate-with-path")]
    [InlineData("  spaced  name  ", "spaced-name")]
    [InlineData(null, "")]
    [InlineData("", "")]
    [InlineData("!!!", "")]
    public void SanitizeFilenameSegment_strips_unsafe_characters(string? input, string expected)
    {
        Assert.Equal(expected, QuestPdfExportService.SanitizeFilenameSegment(input));
    }

    [Fact]
    public void BuildFileName_uses_guid_fallback_when_segment_empty()
    {
        var id = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        var name = QuestPdfExportService.BuildFileName("work-order", "!!!", id);
        Assert.Equal($"work-order-{id:N}.pdf", name);
    }

    [Fact]
    public void BuildFileName_prefers_sanitized_title()
    {
        var id = Guid.NewGuid();
        var name = QuestPdfExportService.BuildFileName("work-order", "Oil Change", id);
        Assert.Equal("work-order-Oil-Change.pdf", name);
    }

    [Fact]
    public void BuildFileName_appends_suffix_for_vehicle_history()
    {
        var id = Guid.NewGuid();
        var name = QuestPdfExportService.BuildFileName("vehicle", "8ABC123", id, "maintenance-history");
        Assert.Equal("vehicle-8ABC123-maintenance-history.pdf", name);
    }

    [Fact]
    public void WorkOrderPdfDocument_generates_without_layout_exception()
    {
        var model = new WorkOrderPdfModel(
            Guid.NewGuid(),
            "Acme Fleet Org",
            "Test Work Order",
            new string('D', 500),
            "Open",
            "High",
            null,
            null,
            null,
            1.5m,
            DateTimeOffset.UtcNow.AddDays(-1),
            null,
            null,
            DateTimeOffset.UtcNow,
            Array.Empty<WorkOrderNotePdfModel>(),
            null);

        var bytes = new WorkOrderPdfDocument(model, PdfTheme.Default).GeneratePdf();
        Assert.True(bytes.Length > 4);
        Assert.Equal((byte)'%', bytes[0]);
        Assert.Equal((byte)'P', bytes[1]);
        Assert.Equal((byte)'D', bytes[2]);
        Assert.Equal((byte)'F', bytes[3]);

        var metadata = new WorkOrderPdfDocument(model, PdfTheme.Default).GetMetadata();
        Assert.Equal("Acme Fleet Org", metadata.Author);
        Assert.Contains("Test Work Order", metadata.Title);
    }

    [Fact]
    public void VehicleMaintenanceHistoryPdfDocument_multipage_timeline_succeeds()
    {
        var history = Enumerable.Range(0, 50)
            .Select(i => new MaintenanceTimelinePdfItem(
                DateTimeOffset.UtcNow.AddDays(-i),
                MaintenanceTimelineItemType.WorkOrder,
                $"Work order {i}",
                "Completed",
                $"Summary text for item {i} that is long enough to wrap in the table cell.",
                Guid.NewGuid().ToString("N")))
            .ToList();

        var upcoming = Enumerable.Range(0, 5)
            .Select(i => new MaintenanceTimelinePdfItem(
                DateTimeOffset.UtcNow.AddDays(30 * i),
                MaintenanceTimelineItemType.Schedule,
                $"Schedule {i}",
                "Active",
                "Due soon",
                Guid.NewGuid().ToString("N")))
            .ToList();

        var model = new VehicleMaintenanceHistoryPdfModel(
            Guid.NewGuid(),
            "OpenFleet Org",
            "2021 Ford Transit",
            "MULTI1",
            "VIN12345678901234",
            50000,
            "Active",
            DateTimeOffset.UtcNow,
            history,
            upcoming);

        var bytes = new VehicleMaintenanceHistoryPdfDocument(model, PdfTheme.Default).GeneratePdf();
        Assert.True(bytes.Length > 4);
        Assert.Equal("%PDF"u8.ToArray(), bytes.AsSpan(0, 4).ToArray());
    }

    [Fact]
    public void Timeline_sort_is_date_desc_then_type_then_reference()
    {
        var items = new List<MaintenanceTimelinePdfItem>
        {
            new(DateTimeOffset.Parse("2026-01-02T00:00:00Z"), MaintenanceTimelineItemType.WorkOrder, "B", null, null, "b"),
            new(DateTimeOffset.Parse("2026-01-03T00:00:00Z"), MaintenanceTimelineItemType.Inspection, "A", null, null, "a"),
            new(DateTimeOffset.Parse("2026-01-02T00:00:00Z"), MaintenanceTimelineItemType.Inspection, "C", null, null, "c"),
            new(DateTimeOffset.Parse("2026-01-02T00:00:00Z"), MaintenanceTimelineItemType.Inspection, "D", null, null, "a"),
        };

        var sorted = items
            .OrderByDescending(i => i.Date)
            .ThenBy(i => i.Type)
            .ThenBy(i => i.ReferenceNumber, StringComparer.Ordinal)
            .ToList();

        Assert.Equal("A", sorted[0].Title);
        Assert.Equal("D", sorted[1].Title);
        Assert.Equal("C", sorted[2].Title);
        Assert.Equal("B", sorted[3].Title);
    }
}
