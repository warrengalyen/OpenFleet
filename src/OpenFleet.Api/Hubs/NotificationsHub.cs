using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using OpenFleet.Application.Common;

namespace OpenFleet.Api.Hubs;

[Authorize(Roles = AuthorizationPolicies.AnyAuthenticated)]
public class NotificationsHub : Hub
{
}
