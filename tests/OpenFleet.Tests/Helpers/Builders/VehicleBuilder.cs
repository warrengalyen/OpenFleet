using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Tests.Helpers.Builders;

/// <summary>
/// Fluent builder for <see cref="Vehicle"/> test instances.
/// Uses an auto-incrementing counter to ensure VIN and LicensePlate are unique per call.
/// </summary>
public class VehicleBuilder
{
    private static int _counter;

    private Guid _id = Guid.NewGuid();
    private string _vin;
    private string _licensePlate;
    private string _make = "Ford";
    private string _model = "F-150";
    private int _year = 2022;
    private int _mileage = 10000;
    private VehicleStatus _status = VehicleStatus.Active;
    private Guid _departmentId = Guid.NewGuid();

    public VehicleBuilder()
    {
        var n = Interlocked.Increment(ref _counter);
        // VIN: 17 chars, only [A-HJ-NPR-Z0-9] - pad with leading zeros
        _vin = $"TEST{n:D13}";
        _licensePlate = $"TST-{n:D4}";
    }

    public VehicleBuilder WithId(Guid id) { _id = id; return this; }
    public VehicleBuilder WithVIN(string vin) { _vin = vin; return this; }
    public VehicleBuilder WithLicensePlate(string plate) { _licensePlate = plate; return this; }
    public VehicleBuilder WithMake(string make) { _make = make; return this; }
    public VehicleBuilder WithModel(string model) { _model = model; return this; }
    public VehicleBuilder WithYear(int year) { _year = year; return this; }
    public VehicleBuilder WithMileage(int mileage) { _mileage = mileage; return this; }
    public VehicleBuilder WithStatus(VehicleStatus status) { _status = status; return this; }
    public VehicleBuilder WithDepartmentId(Guid departmentId) { _departmentId = departmentId; return this; }

    public Vehicle Build() => new()
    {
        Id = _id,
        VIN = _vin,
        LicensePlate = _licensePlate,
        Make = _make,
        Model = _model,
        Year = _year,
        Mileage = _mileage,
        Status = _status,
        DepartmentId = _departmentId
    };
}
