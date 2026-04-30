using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;
using OpenFleet.Infrastructure.Integrations;
using OpenFleet.Infrastructure.Persistence;

namespace OpenFleet.Tests.Infrastructure;

public class MockConnectorTests : IDisposable
{
    private readonly OpenFleetDbContext _context;

    public MockConnectorTests()
    {
        var options = new DbContextOptionsBuilder<OpenFleetDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new OpenFleetDbContext(options);
    }

    public void Dispose() => _context.Dispose();

    private async Task<Department> SeedDeptAsync()
    {
        var dept = new Department { Name = "Test", Code = "TST" };
        _context.Departments.Add(dept);
        await _context.SaveChangesAsync();
        return dept;
    }

    // ── FuelUsageConnector ──────────────────────────────────────────────────

    [Fact]
    public async Task FuelUsage_import_success_returns_true_and_updates_mileage()
    {
        var dept = await SeedDeptAsync();
        _context.Vehicles.Add(new Vehicle
        {
            VIN = "TESTVIN0000000001", LicensePlate = "TST-001",
            Make = "Ford", Model = "F150", Year = 2022,
            Mileage = 10000, Status = VehicleStatus.Active,
            DepartmentId = dept.Id
        });
        await _context.SaveChangesAsync();

        var connector = new FuelUsageConnector(_context, NullLogger<FuelUsageConnector>.Instance);
        var result = await connector.ImportAsync();

        Assert.True(result.Success);
        Assert.Equal(1, result.RecordsProcessed);
        Assert.Null(result.ErrorMessage);
        Assert.NotEmpty(result.Payload);

        var updatedVehicle = await _context.Vehicles.FirstAsync();
        Assert.True(updatedVehicle.Mileage >= 10050);
    }

    [Fact]
    public async Task FuelUsage_import_simulated_failure_returns_false()
    {
        var connector = new FuelUsageConnector(_context, NullLogger<FuelUsageConnector>.Instance, simulateFailure: true);
        var result = await connector.ImportAsync();

        Assert.False(result.Success);
        Assert.Equal(0, result.RecordsProcessed);
        Assert.NotEmpty(result.ErrorMessage!);
    }

    [Fact]
    public async Task FuelUsage_export_success_returns_vehicle_json()
    {
        var dept = await SeedDeptAsync();
        _context.Vehicles.Add(new Vehicle
        {
            VIN = "TESTVIN0000000002", LicensePlate = "TST-002",
            Make = "GM", Model = "Silverado", Year = 2021,
            Mileage = 20000, Status = VehicleStatus.Active,
            DepartmentId = dept.Id
        });
        await _context.SaveChangesAsync();

        var connector = new FuelUsageConnector(_context, NullLogger<FuelUsageConnector>.Instance);
        var result = await connector.ExportAsync();

        Assert.True(result.Success);
        Assert.Equal(1, result.RecordsProcessed);
        Assert.Contains("TESTVIN0000000002", result.Payload);
    }

    // ── VendorRepairConnector ───────────────────────────────────────────────

    [Fact]
    public async Task VendorRepair_import_success_processes_open_work_orders()
    {
        var dept = await SeedDeptAsync();
        var vehicle = new Vehicle
        {
            VIN = "TESTVIN0000000003", LicensePlate = "TST-003",
            Make = "Ford", Model = "Transit", Year = 2020,
            Mileage = 5000, Status = VehicleStatus.InMaintenance,
            DepartmentId = dept.Id
        };
        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();

        _context.WorkOrders.Add(new WorkOrder
        {
            Title = "Brake Job",
            Description = "Fix brakes",
            Status = WorkOrderStatus.WaitingForParts,
            Priority = WorkOrderPriority.High,
            VehicleId = vehicle.Id
        });
        await _context.SaveChangesAsync();

        var connector = new VendorRepairConnector(_context, NullLogger<VendorRepairConnector>.Instance);
        var result = await connector.ImportAsync();

        Assert.True(result.Success);
        Assert.True(result.RecordsProcessed >= 1);
        Assert.Null(result.ErrorMessage);
    }

    [Fact]
    public async Task VendorRepair_import_simulated_failure_returns_false()
    {
        var connector = new VendorRepairConnector(_context, NullLogger<VendorRepairConnector>.Instance, simulateFailure: true);
        var result = await connector.ImportAsync();

        Assert.False(result.Success);
        Assert.NotEmpty(result.ErrorMessage!);
    }

    // ── PartsSupplierConnector ──────────────────────────────────────────────

    [Fact]
    public async Task PartsSupplier_import_success_updates_quantity_on_hand()
    {
        var vendor = new Vendor
        {
            Name = "Test Vendor", ContactName = "V Contact",
            Email = "v@test.com", Phone = "555-0000",
            Address = "100 Test St"
        };
        _context.Vendors.Add(vendor);
        await _context.SaveChangesAsync();

        _context.Parts.Add(new Part
        {
            Name = "Widget", PartNumber = "WGT-001",
            VendorId = vendor.Id, QuantityOnHand = 10, UnitCost = 5.00m
        });
        await _context.SaveChangesAsync();

        var connector = new PartsSupplierConnector(_context, NullLogger<PartsSupplierConnector>.Instance);
        var result = await connector.ImportAsync();

        Assert.True(result.Success);
        Assert.Equal(1, result.RecordsProcessed);

        var updatedPart = await _context.Parts.FirstAsync();
        // QuantityOnHand should have been updated by mock (0–199)
        Assert.InRange(updatedPart.QuantityOnHand, 0, 199);
    }

    [Fact]
    public async Task PartsSupplier_import_simulated_failure_returns_false()
    {
        var connector = new PartsSupplierConnector(_context, NullLogger<PartsSupplierConnector>.Instance, simulateFailure: true);
        var result = await connector.ImportAsync();

        Assert.False(result.Success);
        Assert.NotEmpty(result.ErrorMessage!);
    }

    // ── ExternalAssetConnector ──────────────────────────────────────────────

    [Fact]
    public async Task ExternalAsset_import_success_creates_new_assets()
    {
        var connector = new ExternalAssetConnector(_context, NullLogger<ExternalAssetConnector>.Instance);
        var result = await connector.ImportAsync();

        Assert.True(result.Success);
        Assert.Equal(3, result.RecordsProcessed);

        var assetCount = await _context.Assets.CountAsync();
        Assert.Equal(3, assetCount);
    }

    [Fact]
    public async Task ExternalAsset_import_upserts_existing_assets()
    {
        // Pre-create one of the mock assets so it gets updated, not inserted
        _context.Assets.Add(new Asset
        {
            AssetTag = "EXT-001",
            Name = "Old Forklift Name",
            Type = "Heavy Equipment",
            Condition = AssetCondition.Poor,
            Status = AssetStatus.Available
        });
        await _context.SaveChangesAsync();

        var connector = new ExternalAssetConnector(_context, NullLogger<ExternalAssetConnector>.Instance);
        var result = await connector.ImportAsync();

        Assert.True(result.Success);
        Assert.Equal(3, result.RecordsProcessed);

        // Should still be 3 total assets (1 updated + 2 new)
        var assetCount = await _context.Assets.CountAsync();
        Assert.Equal(3, assetCount);

        var updatedAsset = await _context.Assets.FirstAsync(a => a.AssetTag == "EXT-001");
        Assert.Equal("Forklift A", updatedAsset.Name);
    }

    [Fact]
    public async Task ExternalAsset_import_simulated_failure_returns_false()
    {
        var connector = new ExternalAssetConnector(_context, NullLogger<ExternalAssetConnector>.Instance, simulateFailure: true);
        var result = await connector.ImportAsync();

        Assert.False(result.Success);
        Assert.NotEmpty(result.ErrorMessage!);
    }

    [Fact]
    public async Task ExternalAsset_export_returns_all_assets()
    {
        _context.Assets.AddRange(
            new Asset { AssetTag = "A1", Name = "Item1", Type = "T", Condition = AssetCondition.Good, Status = AssetStatus.Available },
            new Asset { AssetTag = "A2", Name = "Item2", Type = "T", Condition = AssetCondition.Fair, Status = AssetStatus.InUse }
        );
        await _context.SaveChangesAsync();

        var connector = new ExternalAssetConnector(_context, NullLogger<ExternalAssetConnector>.Instance);
        var result = await connector.ExportAsync();

        Assert.True(result.Success);
        Assert.Equal(2, result.RecordsProcessed);
        Assert.Contains("A1", result.Payload);
        Assert.Contains("A2", result.Payload);
    }
}
