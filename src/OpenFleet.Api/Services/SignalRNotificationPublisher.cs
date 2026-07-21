using Microsoft.AspNetCore.SignalR;
using OpenFleet.Api.Hubs;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Interfaces;

namespace OpenFleet.Api.Services;

public sealed class SignalRNotificationPublisher : INotificationPublisher
{
    public const string WorkOrderStatusChangedEvent = "WorkOrderStatusChanged";
    public const string MaintenanceOverdueEvent = "MaintenanceOverdue";

    private readonly IHubContext<NotificationsHub> _hubContext;

    public SignalRNotificationPublisher(IHubContext<NotificationsHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task PublishWorkOrderStatusChangedAsync(
        WorkOrderStatusChangedNotification notification,
        CancellationToken cancellationToken = default) =>
        _hubContext.Clients.All.SendAsync(
            WorkOrderStatusChangedEvent,
            notification,
            cancellationToken);

    public Task PublishMaintenanceOverdueAsync(
        MaintenanceOverdueNotification notification,
        CancellationToken cancellationToken = default) =>
        _hubContext.Clients.All.SendAsync(
            MaintenanceOverdueEvent,
            notification,
            cancellationToken);
}
