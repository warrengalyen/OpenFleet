using OpenFleet.Domain.Enums;
using OpenFleet.Domain.Services;

namespace OpenFleet.Tests.Domain;

public class WorkOrderStatusRulesTests
{
    // --- Valid transitions ---

    [Theory]
    [InlineData(WorkOrderStatus.Open, WorkOrderStatus.InProgress)]
    [InlineData(WorkOrderStatus.Open, WorkOrderStatus.WaitingForParts)]
    [InlineData(WorkOrderStatus.Open, WorkOrderStatus.Cancelled)]
    [InlineData(WorkOrderStatus.InProgress, WorkOrderStatus.WaitingForParts)]
    [InlineData(WorkOrderStatus.InProgress, WorkOrderStatus.Completed)]
    [InlineData(WorkOrderStatus.InProgress, WorkOrderStatus.Cancelled)]
    [InlineData(WorkOrderStatus.WaitingForParts, WorkOrderStatus.InProgress)]
    [InlineData(WorkOrderStatus.WaitingForParts, WorkOrderStatus.Cancelled)]
    public void CanTransition_returns_true_for_valid_transitions(WorkOrderStatus from, WorkOrderStatus to)
    {
        Assert.True(WorkOrderStatusRules.CanTransition(from, to));
    }

    // --- Invalid transitions ---

    [Theory]
    [InlineData(WorkOrderStatus.Open, WorkOrderStatus.Completed)]
    [InlineData(WorkOrderStatus.Open, WorkOrderStatus.Open)]
    [InlineData(WorkOrderStatus.InProgress, WorkOrderStatus.Open)]
    [InlineData(WorkOrderStatus.InProgress, WorkOrderStatus.InProgress)]
    [InlineData(WorkOrderStatus.WaitingForParts, WorkOrderStatus.Completed)]
    [InlineData(WorkOrderStatus.WaitingForParts, WorkOrderStatus.Open)]
    [InlineData(WorkOrderStatus.Completed, WorkOrderStatus.Open)]
    [InlineData(WorkOrderStatus.Completed, WorkOrderStatus.InProgress)]
    [InlineData(WorkOrderStatus.Completed, WorkOrderStatus.Cancelled)]
    [InlineData(WorkOrderStatus.Cancelled, WorkOrderStatus.Open)]
    [InlineData(WorkOrderStatus.Cancelled, WorkOrderStatus.InProgress)]
    [InlineData(WorkOrderStatus.Cancelled, WorkOrderStatus.Completed)]
    public void CanTransition_returns_false_for_invalid_transitions(WorkOrderStatus from, WorkOrderStatus to)
    {
        Assert.False(WorkOrderStatusRules.CanTransition(from, to));
    }

    // --- Terminal states ---

    [Fact]
    public void AllowedTransitions_returns_empty_for_Completed()
    {
        var allowed = WorkOrderStatusRules.AllowedTransitions(WorkOrderStatus.Completed);
        Assert.Empty(allowed);
    }

    [Fact]
    public void AllowedTransitions_returns_empty_for_Cancelled()
    {
        var allowed = WorkOrderStatusRules.AllowedTransitions(WorkOrderStatus.Cancelled);
        Assert.Empty(allowed);
    }

    [Fact]
    public void AllowedTransitions_Open_contains_expected_states()
    {
        var allowed = WorkOrderStatusRules.AllowedTransitions(WorkOrderStatus.Open);
        Assert.Contains(WorkOrderStatus.InProgress, allowed);
        Assert.Contains(WorkOrderStatus.WaitingForParts, allowed);
        Assert.Contains(WorkOrderStatus.Cancelled, allowed);
        Assert.DoesNotContain(WorkOrderStatus.Completed, allowed);
    }

    [Fact]
    public void AllowedTransitions_WaitingForParts_cannot_complete_directly()
    {
        var allowed = WorkOrderStatusRules.AllowedTransitions(WorkOrderStatus.WaitingForParts);
        Assert.DoesNotContain(WorkOrderStatus.Completed, allowed);
    }
}
