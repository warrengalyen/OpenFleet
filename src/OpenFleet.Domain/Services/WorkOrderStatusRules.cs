using OpenFleet.Domain.Enums;

namespace OpenFleet.Domain.Services;

public static class WorkOrderStatusRules
{
    private static readonly Dictionary<WorkOrderStatus, WorkOrderStatus[]> AllowedMap = new()
    {
        [WorkOrderStatus.Open]            = [WorkOrderStatus.InProgress, WorkOrderStatus.WaitingForParts, WorkOrderStatus.Cancelled],
        [WorkOrderStatus.InProgress]      = [WorkOrderStatus.WaitingForParts, WorkOrderStatus.Completed, WorkOrderStatus.Cancelled],
        [WorkOrderStatus.WaitingForParts] = [WorkOrderStatus.InProgress, WorkOrderStatus.Cancelled],
        [WorkOrderStatus.Completed]       = [],
        [WorkOrderStatus.Cancelled]       = []
    };

    public static bool CanTransition(WorkOrderStatus from, WorkOrderStatus to)
    {
        return AllowedMap.TryGetValue(from, out var allowed) && allowed.Contains(to);
    }

    public static WorkOrderStatus[] AllowedTransitions(WorkOrderStatus from)
    {
        return AllowedMap.TryGetValue(from, out var allowed) ? allowed : [];
    }
}
