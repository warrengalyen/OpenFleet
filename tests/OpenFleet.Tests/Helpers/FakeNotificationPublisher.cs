using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;

namespace OpenFleet.Tests.Helpers;

public sealed class FakeNotificationPublisher : INotificationPublisher
{
    public List<WorkOrderStatusChangedNotification> WorkOrderStatusChanges { get; } = [];
    public List<MaintenanceOverdueNotification> MaintenanceOverdueAlerts { get; } = [];

    public Task PublishWorkOrderStatusChangedAsync(
        WorkOrderStatusChangedNotification notification,
        CancellationToken cancellationToken = default)
    {
        WorkOrderStatusChanges.Add(notification);
        return Task.CompletedTask;
    }

    public Task PublishMaintenanceOverdueAsync(
        MaintenanceOverdueNotification notification,
        CancellationToken cancellationToken = default)
    {
        MaintenanceOverdueAlerts.Add(notification);
        return Task.CompletedTask;
    }
}
