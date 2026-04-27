using OpenFleet.Domain.Enums;

namespace OpenFleet.Domain.Services;

public static class InspectionWorkOrderPolicy
{
    public static bool ShouldCreateWorkOrder(InspectionStatus status)
        => status == InspectionStatus.Failed;

    public static WorkOrderPriority RecommendedPriority() => WorkOrderPriority.High;

    public static string GenerateWorkOrderTitle(string vehicleOrAssetDescription)
        => $"Inspection Failure - {vehicleOrAssetDescription}";
}
