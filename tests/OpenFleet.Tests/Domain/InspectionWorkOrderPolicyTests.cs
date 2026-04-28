using OpenFleet.Domain.Enums;
using OpenFleet.Domain.Services;
using Xunit;

namespace OpenFleet.Tests.Domain;

public class InspectionWorkOrderPolicyTests
{
    [Fact]
    public void Failed_status_should_create_work_order()
    {
        Assert.True(InspectionWorkOrderPolicy.ShouldCreateWorkOrder(InspectionStatus.Failed));
    }

    [Fact]
    public void Passed_status_should_not_create_work_order()
    {
        Assert.False(InspectionWorkOrderPolicy.ShouldCreateWorkOrder(InspectionStatus.Passed));
    }

    [Fact]
    public void NeedsReview_status_should_not_create_work_order()
    {
        Assert.False(InspectionWorkOrderPolicy.ShouldCreateWorkOrder(InspectionStatus.NeedsReview));
    }

    [Fact]
    public void RecommendedPriority_returns_High()
    {
        Assert.Equal(WorkOrderPriority.High, InspectionWorkOrderPolicy.RecommendedPriority());
    }

    [Fact]
    public void GenerateWorkOrderTitle_includes_description()
    {
        var title = InspectionWorkOrderPolicy.GenerateWorkOrderTitle("2022 Ford F-150");
        Assert.Contains("2022 Ford F-150", title);
        Assert.StartsWith("Inspection Failure", title);
    }
}
