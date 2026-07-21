using Microsoft.EntityFrameworkCore;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Services;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;
using OpenFleet.Infrastructure.Persistence;
using OpenFleet.Tests.Helpers;

namespace OpenFleet.Tests.Application;

public class WorkOrderServiceNotificationTests : IDisposable
{
    private readonly OpenFleetDbContext _context;
    private readonly FakeNotificationPublisher _publisher;
    private readonly WorkOrderService _service;
    private readonly Guid _deptId = Guid.NewGuid();
    private readonly Guid _vehicleId = Guid.NewGuid();

    public WorkOrderServiceNotificationTests()
    {
        var options = new DbContextOptionsBuilder<OpenFleetDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new OpenFleetDbContext(options);
        _publisher = new FakeNotificationPublisher();
        var settingsProvider = ApplicationSettingsTestHelper.CreateProviderAsync(_context).GetAwaiter().GetResult();
        _service = new WorkOrderService(
            _context,
            new AuditService(_context),
            settingsProvider,
            _publisher);

        _context.Departments.Add(new Department { Id = _deptId, Name = "Ops", Code = "OPS" });
        _context.Vehicles.Add(new Vehicle
        {
            Id = _vehicleId,
            VIN = "NOTIF1234567890AB",
            LicensePlate = "NTF-001",
            Make = "Ford",
            Model = "Transit",
            Year = 2022,
            Mileage = 1000,
            Status = VehicleStatus.Active,
            DepartmentId = _deptId,
        });
        _context.SaveChanges();
    }

    public void Dispose() => _context.Dispose();

    [Fact]
    public async Task TransitionStatusAsync_publishes_work_order_status_changed()
    {
        var created = await _service.CreateAsync(new CreateWorkOrderRequest(
            Title: "Brake job",
            Description: "Pads",
            Priority: WorkOrderPriority.High,
            VehicleId: _vehicleId,
            AssetId: null,
            AssignedUserId: null));

        Assert.True(created.IsSuccess);
        _publisher.WorkOrderStatusChanges.Clear();

        var result = await _service.TransitionStatusAsync(
            created.Value!.Id,
            WorkOrderStatus.InProgress,
            changedBy: "tester");

        Assert.True(result.IsSuccess);
        Assert.Single(_publisher.WorkOrderStatusChanges);
        var notification = _publisher.WorkOrderStatusChanges[0];
        Assert.Equal(created.Value.Id, notification.WorkOrderId);
        Assert.Equal("Brake job", notification.Title);
        Assert.Equal(nameof(WorkOrderStatus.Open), notification.OldStatus);
        Assert.Equal(nameof(WorkOrderStatus.InProgress), notification.NewStatus);
    }

    [Fact]
    public async Task TransitionStatusAsync_invalid_transition_does_not_publish()
    {
        var created = await _service.CreateAsync(new CreateWorkOrderRequest(
            Title: "Done WO",
            Description: null,
            Priority: WorkOrderPriority.Low,
            VehicleId: _vehicleId,
            AssetId: null,
            AssignedUserId: null));

        await _service.TransitionStatusAsync(created.Value!.Id, WorkOrderStatus.InProgress);
        await _service.TransitionStatusAsync(created.Value.Id, WorkOrderStatus.Completed);
        _publisher.WorkOrderStatusChanges.Clear();

        var result = await _service.TransitionStatusAsync(
            created.Value.Id,
            WorkOrderStatus.Open);

        Assert.False(result.IsSuccess);
        Assert.Empty(_publisher.WorkOrderStatusChanges);
    }
}
