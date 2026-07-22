using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using OpenFleet.Application.Common;

namespace OpenFleet.Api.Hubs;

[Authorize(Policy = AuthorizationPolicies.AnyAuthenticated)]
public class NotificationsHub : Hub
{
}
