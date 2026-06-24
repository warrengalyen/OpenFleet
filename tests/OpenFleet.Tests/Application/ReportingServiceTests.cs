using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.Services;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;
using OpenFleet.Infrastructure.Persistence;
using OpenFleet.Tests.Helpers;

namespace OpenFleet.Tests.Application;

public class ReportingServiceTests : IDisposable
{
    private readonly OpenFleetDbContext _context;
    private readonly ReportingService _service;

    private static readonly Guid DeptId = Guid.NewGuid();
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly Guid VehicleAId = Guid.NewGuid();
    private static readonly Guid VehicleBId = Guid.NewGuid();
    private static readonly Guid VendorId = Guid.NewGuid();

    public ReportingServiceTests()
    {
        var options = new DbContextOptionsBuilder<OpenFleetDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new OpenFleetDbContext(options);
        var settingsProvider = ApplicationSettingsTestHelper.CreateProviderAsync(_context).GetAwaiter().GetResult();
        _service = new ReportingService(_context, settingsProvider);
        SeedTestData();
    }

    public void Dispose() => _context.Dispose();

    private void SeedTestData()
    {
        _context.Departments.Add(new Department { Id = DeptId, Name = "Fleet", Code = "FLT" });
        _context.Users.Add(new User
        {
            Id = UserId, FirstName = "Test", LastName = "Tech",
            Email = "tech@test.io", Role = UserRole.Technician, DepartmentId = DeptId
        });
        _context.Vehicles.AddRange(
            new Vehicle { Id = VehicleAId, VIN = "VIN0000000000000A1", LicensePlate = "TST-001", Make = "Ford", Model = "F-150", Year = 2022, Mileage = 20000, Status = VehicleStatus.Active, DepartmentId = DeptId },
            new Vehicle { Id = VehicleBId, VIN = "VIN0000000000000B2", LicensePlate = "TST-002", Make = "Chevy", Model = "Silverado", Year = 2020, Mileage = 35000, Status = VehicleStatus.InMaintenance, DepartmentId = DeptId }
        );
        _context.Vendors.Add(new Vendor { Id = VendorId, Name = "TestVendor", ContactName = "Joe", Email = "joe@vendor.io", Phone = "555-0000", Address = "1 Test St" });
        _context.Parts.AddRange(
            new Part { Name = "Oil Filter", PartNumber = "OF-001", VendorId = VendorId, QuantityOnHand = 10, UnitCost = 15.00m },
            new Part { Name = "Brake Pads", PartNumber = "BP-001", VendorId = VendorId, QuantityOnHand = 5, UnitCost = 50.00m }
        );
        _context.SaveChanges();

        // Work orders: 2 open, 1 in-progress, 1 completed (Vehicle A), 1 completed (Vehicle B)
        var woCompleted1 = new WorkOrder { VehicleId = VehicleAId, AssignedUserId = UserId, Title = "Oil Change", Status = WorkOrderStatus.Completed, Priority = WorkOrderPriority.Low, LaborHours = 1.5m, CompletedAt = DateTime.UtcNow.AddDays(-5) };
        var woCompleted2 = new WorkOrder { VehicleId = VehicleAId, AssignedUserId = UserId, Title = "Brake Job", Status = WorkOrderStatus.Completed, Priority = WorkOrderPriority.High, LaborHours = 3.0m, CompletedAt = DateTime.UtcNow.AddDays(-10) };
        var woCompletedB = new WorkOrder { VehicleId = VehicleBId, AssignedUserId = UserId, Title = "Engine Tune", Status = WorkOrderStatus.Completed, Priority = WorkOrderPriority.Medium, LaborHours = 2.0m, CompletedAt = DateTime.UtcNow.AddDays(-2) };
        var woOpen = new WorkOrder { VehicleId = VehicleAId, AssignedUserId = UserId, Title = "Tire Rotation", Status = WorkOrderStatus.Open, Priority = WorkOrderPriority.Low };
        var woInProgress = new WorkOrder { VehicleId = VehicleBId, AssignedUserId = UserId, Title = "Transmission Service", Status = WorkOrderStatus.InProgress, Priority = WorkOrderPriority.High };
        var woWaiting = new WorkOrder { VehicleId = VehicleAId, AssignedUserId = UserId, Title = "Coolant Flush", Status = WorkOrderStatus.WaitingForParts, Priority = WorkOrderPriority.Medium };
        var woCancelled = new WorkOrder { VehicleId = VehicleBId, AssignedUserId = UserId, Title = "Wiper Blades", Status = WorkOrderStatus.Cancelled, Priority = WorkOrderPriority.Low };
        var woCritical = new WorkOrder { VehicleId = VehicleBId, AssignedUserId = UserId, Title = "Engine Diagnostic", Status = WorkOrderStatus.Open, Priority = WorkOrderPriority.Critical };
        _context.WorkOrders.AddRange(woCompleted1, woCompleted2, woCompletedB, woOpen, woInProgress, woWaiting, woCancelled, woCritical);
        _context.SaveChanges();

        // Inspections: 2 passed, 1 failed, 1 needs review
        _context.Inspections.AddRange(
            new Inspection { VehicleId = VehicleAId, InspectorUserId = UserId, InspectedAt = DateTime.UtcNow.AddDays(-1), Status = InspectionStatus.Passed },
            new Inspection { VehicleId = VehicleAId, InspectorUserId = UserId, InspectedAt = DateTime.UtcNow.AddDays(-8), Status = InspectionStatus.Passed },
            new Inspection { VehicleId = VehicleBId, InspectorUserId = UserId, InspectedAt = DateTime.UtcNow.AddDays(-3), Status = InspectionStatus.Failed },
            new Inspection { VehicleId = VehicleBId, InspectorUserId = UserId, InspectedAt = DateTime.UtcNow.AddDays(-15), Status = InspectionStatus.NeedsReview }
        );

        // Maintenance schedule — overdue by date
        _context.MaintenanceSchedules.Add(new MaintenanceSchedule
        {
            Name = "Annual Inspection",
            VehicleId = VehicleAId,
            DayInterval = 365,
            LastPerformedAt = DateTime.UtcNow.AddDays(-400),
            IsActive = true
        });
        _context.SaveChanges();
    }

    // ── Open work orders ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetOpenWorkOrders_returns_correct_counts()
    {
        var report = await _service.GetOpenWorkOrdersAsync();

        // 3 open (Open + InProgress + WaitingForParts) — completed and cancelled excluded
        Assert.Equal(4, report.TotalOpen); // Open x2 + InProgress x1 + Waiting x1
        Assert.Equal(2, report.Open);
        Assert.Equal(1, report.InProgress);
        Assert.Equal(1, report.WaitingForParts);
    }

    [Fact]
    public async Task GetOpenWorkOrders_items_exclude_completed_and_cancelled()
    {
        var report = await _service.GetOpenWorkOrdersAsync();

        Assert.DoesNotContain(report.Items, i => i.Status == WorkOrderStatus.Completed);
        Assert.DoesNotContain(report.Items, i => i.Status == WorkOrderStatus.Cancelled);
    }

    // ── Maintenance cost by vehicle ────────────────────────────────────────────

    [Fact]
    public async Task GetMaintenanceCostByVehicle_groups_by_vehicle_correctly()
    {
        var report = await _service.GetMaintenanceCostByVehicleAsync();

        Assert.Equal(2, report.Vehicles.Count);

        var vehicleA = report.Vehicles.First(v => v.VehicleId == VehicleAId);
        Assert.Equal(4.5m, vehicleA.TotalLaborHours); // 1.5 + 3.0
        Assert.Equal(2, vehicleA.CompletedWorkOrders);

        var vehicleB = report.Vehicles.First(v => v.VehicleId == VehicleBId);
        Assert.Equal(2.0m, vehicleB.TotalLaborHours);
        Assert.Equal(1, vehicleB.CompletedWorkOrders);
    }

    [Fact]
    public async Task GetMaintenanceCostByVehicle_excludes_non_completed_work_orders()
    {
        var report = await _service.GetMaintenanceCostByVehicleAsync();

        // Total completed = 3, so both vehicles appear. Totals should not include open/cancelled.
        var totalCompleted = report.Vehicles.Sum(v => v.CompletedWorkOrders);
        Assert.Equal(3, totalCompleted);
    }

    // ── Parts usage ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetPartUsageSummary_calculates_total_inventory_value()
    {
        var report = await _service.GetPartUsageSummaryAsync();

        Assert.Equal(2, report.TotalParts);
        // Oil Filter: 10 * 15.00 = 150.00; Brake Pads: 5 * 50.00 = 250.00; Total = 400.00
        Assert.Equal(400.00m, report.TotalInventoryValue);
    }

    [Fact]
    public async Task GetPartUsageSummary_per_part_total_value_is_correct()
    {
        var report = await _service.GetPartUsageSummaryAsync();

        var brakePads = report.Parts.First(p => p.Name == "Brake Pads");
        Assert.Equal(250.00m, brakePads.TotalValue);

        var oilFilter = report.Parts.First(p => p.Name == "Oil Filter");
        Assert.Equal(150.00m, oilFilter.TotalValue);
    }

    // ── Inspection failure rate ────────────────────────────────────────────────

    [Fact]
    public async Task GetInspectionFailureRate_counts_are_correct()
    {
        var report = await _service.GetInspectionFailureRateAsync();

        Assert.Equal(4, report.TotalInspections);
        Assert.Equal(2, report.Passed);
        Assert.Equal(1, report.Failed);
        Assert.Equal(1, report.NeedsReview);
    }

    [Fact]
    public async Task GetInspectionFailureRate_percentage_rounds_correctly()
    {
        var report = await _service.GetInspectionFailureRateAsync();

        // 1 failed out of 4 = 25.0%
        Assert.Equal(25.0, report.FailureRatePercent);
    }

    [Fact]
    public async Task GetInspectionFailureRate_with_no_failures_returns_zero_percent()
    {
        // Seed a fresh DB with only passed inspections
        var options = new DbContextOptionsBuilder<OpenFleetDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        using var ctx = new OpenFleetDbContext(options);
        var settingsProvider = await ApplicationSettingsTestHelper.CreateProviderAsync(ctx);
        var svc = new ReportingService(ctx, settingsProvider);

        var deptId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        ctx.Departments.Add(new Department { Id = deptId, Name = "D", Code = "D" });
        ctx.Users.Add(new User { Id = userId, FirstName = "A", LastName = "B", Email = "a@b.io", Role = UserRole.Viewer, DepartmentId = deptId });
        ctx.Vehicles.Add(new Vehicle { Id = vehicleId, VIN = "VINXXX000000000001", LicensePlate = "X-001", Make = "X", Model = "Y", Year = 2020, Mileage = 0, Status = VehicleStatus.Active, DepartmentId = deptId });
        ctx.Inspections.AddRange(
            new Inspection { VehicleId = vehicleId, InspectorUserId = userId, InspectedAt = DateTime.UtcNow, Status = InspectionStatus.Passed },
            new Inspection { VehicleId = vehicleId, InspectorUserId = userId, InspectedAt = DateTime.UtcNow, Status = InspectionStatus.Passed }
        );
        ctx.SaveChanges();

        var report = await svc.GetInspectionFailureRateAsync();

        Assert.Equal(0.0, report.FailureRatePercent);
        Assert.Equal(0, report.Failed);
    }

    // ── Work orders by status ─────────────────────────────────────────────────

    [Fact]
    public async Task GetWorkOrdersByStatus_all_statuses_are_counted()
    {
        var report = await _service.GetWorkOrdersByStatusAsync();

        Assert.Equal(2, report.Open);
        Assert.Equal(1, report.InProgress);
        Assert.Equal(1, report.WaitingForParts);
        Assert.Equal(3, report.Completed);
        Assert.Equal(1, report.Cancelled);
        Assert.Equal(8, report.Total);
    }

    // ── Work orders by priority ────────────────────────────────────────────────

    [Fact]
    public async Task GetWorkOrdersByPriority_all_priorities_are_counted()
    {
        var report = await _service.GetWorkOrdersByPriorityAsync();

        // Low: woCompleted1(Low), woOpen(Low), woCancelled(Low) = 3
        Assert.Equal(3, report.Low);
        // Medium: woCompletedB(Medium), woWaiting(Medium) = 2
        Assert.Equal(2, report.Medium);
        // High: woCompleted2(High), woInProgress(High) = 2
        Assert.Equal(2, report.High);
        // Critical: woCritical = 1
        Assert.Equal(1, report.Critical);
        Assert.Equal(8, report.Total);
    }

    // ── Vehicles due for service ───────────────────────────────────────────────

    [Fact]
    public async Task GetVehiclesDueForService_returns_overdue_vehicle()
    {
        var report = await _service.GetVehiclesDueForServiceAsync();

        // Vehicle A has an annual inspection schedule last performed 400 days ago
        Assert.True(report.TotalDue >= 1);
        Assert.Contains(report.Vehicles, v => v.VehicleId == VehicleAId);
    }

    // ── Vehicle downtime ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetVehicleDowntime_includes_vehicle_in_maintenance_status()
    {
        var report = await _service.GetVehicleDowntimeAsync();

        // Vehicle B is InMaintenance and has an InProgress work order
        Assert.True(report.VehiclesInMaintenance >= 1);
        Assert.Contains(report.Vehicles, v => v.VehicleId == VehicleBId);
    }
}
