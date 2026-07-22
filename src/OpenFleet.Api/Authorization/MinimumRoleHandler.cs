using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Api.Authorization;

public sealed class MinimumRoleHandler : AuthorizationHandler<MinimumRoleRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        MinimumRoleRequirement requirement)
    {
        var roleClaim = context.User.FindFirstValue(ClaimTypes.Role);
        if (roleClaim is null)
            return Task.CompletedTask;

        if (!Enum.TryParse<UserRole>(roleClaim, ignoreCase: true, out var userRole))
            return Task.CompletedTask;

        if (userRole >= requirement.MinimumRole)
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
