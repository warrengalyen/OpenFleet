using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Tests.Helpers.Builders;

/// <summary>
/// Fluent builder for <see cref="WorkOrder"/> test instances.
/// </summary>
public class WorkOrderBuilder
{
    private static int _counter;

    private Guid _id = Guid.NewGuid();
    private string _title;
    private string _description = "Test work order description.";
    private WorkOrderStatus _status = WorkOrderStatus.Open;
    private WorkOrderPriority _priority = WorkOrderPriority.Medium;
    private Guid? _vehicleId;
    private Guid? _assetId;
    private Guid? _assignedUserId;
    private decimal _laborHours;
    private DateTime? _completedAt;

    public WorkOrderBuilder()
    {
        var n = Interlocked.Increment(ref _counter);
        _title = $"Work Order {n}";
    }

    public WorkOrderBuilder WithId(Guid id) { _id = id; return this; }
    public WorkOrderBuilder WithTitle(string title) { _title = title; return this; }
    public WorkOrderBuilder WithDescription(string description) { _description = description; return this; }
    public WorkOrderBuilder WithStatus(WorkOrderStatus status) { _status = status; return this; }
    public WorkOrderBuilder WithPriority(WorkOrderPriority priority) { _priority = priority; return this; }
    public WorkOrderBuilder WithVehicleId(Guid vehicleId) { _vehicleId = vehicleId; return this; }
    public WorkOrderBuilder WithAssetId(Guid assetId) { _assetId = assetId; return this; }
    public WorkOrderBuilder WithAssignedUserId(Guid userId) { _assignedUserId = userId; return this; }
    public WorkOrderBuilder WithLaborHours(decimal hours) { _laborHours = hours; return this; }
    public WorkOrderBuilder Completed(decimal laborHours = 1.0m)
    {
        _status = WorkOrderStatus.Completed;
        _laborHours = laborHours;
        _completedAt = DateTime.UtcNow;
        return this;
    }

    public WorkOrder Build() => new()
    {
        Id = _id,
        Title = _title,
        Description = _description,
        Status = _status,
        Priority = _priority,
        VehicleId = _vehicleId,
        AssetId = _assetId,
        AssignedUserId = _assignedUserId,
        LaborHours = _laborHours,
        CompletedAt = _completedAt
    };
}
