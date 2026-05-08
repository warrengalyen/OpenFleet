using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Tests.Helpers.Builders;

/// <summary>
/// Fluent builder for <see cref="Inspection"/> test instances.
/// </summary>
public class InspectionBuilder
{
    private Guid _id = Guid.NewGuid();
    private Guid? _vehicleId;
    private Guid? _assetId;
    private Guid _inspectorUserId = Guid.NewGuid();
    private DateTime _inspectedAt = DateTime.UtcNow.AddHours(-1);
    private InspectionStatus _status = InspectionStatus.Passed;
    private string _notes = string.Empty;
    private Guid? _generatedWorkOrderId;

    public InspectionBuilder WithId(Guid id) { _id = id; return this; }
    public InspectionBuilder WithVehicleId(Guid vehicleId) { _vehicleId = vehicleId; return this; }
    public InspectionBuilder WithAssetId(Guid assetId) { _assetId = assetId; return this; }
    public InspectionBuilder WithInspectorUserId(Guid userId) { _inspectorUserId = userId; return this; }
    public InspectionBuilder WithInspectedAt(DateTime inspectedAt) { _inspectedAt = inspectedAt; return this; }
    public InspectionBuilder WithStatus(InspectionStatus status) { _status = status; return this; }
    public InspectionBuilder WithNotes(string notes) { _notes = notes; return this; }
    public InspectionBuilder WithGeneratedWorkOrderId(Guid workOrderId) { _generatedWorkOrderId = workOrderId; return this; }

    public InspectionBuilder Failed(string notes = "Failed inspection.")
    {
        _status = InspectionStatus.Failed;
        _notes = notes;
        return this;
    }

    public Inspection Build() => new()
    {
        Id = _id,
        VehicleId = _vehicleId,
        AssetId = _assetId,
        InspectorUserId = _inspectorUserId,
        InspectedAt = _inspectedAt,
        Status = _status,
        Notes = _notes,
        GeneratedWorkOrderId = _generatedWorkOrderId
    };
}
