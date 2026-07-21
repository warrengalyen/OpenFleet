using OpenFleet.Application.DTOs;

namespace OpenFleet.Application.Interfaces;

public interface INotificationPublisher
{
    Task PublishWorkOrderStatusChangedAsync(
        WorkOrderStatusChangedNotification notification,
        CancellationToken cancellationToken = default);

    Task PublishMaintenanceOverdueAsync(
        MaintenanceOverdueNotification notification,
        CancellationToken cancellationToken = default);
}
