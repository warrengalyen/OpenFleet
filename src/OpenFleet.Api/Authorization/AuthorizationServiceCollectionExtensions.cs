using Microsoft.AspNetCore.Authorization;
using OpenFleet.Application.Common;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Api.Authorization;

public static class AuthorizationServiceCollectionExtensions
{
    public static IServiceCollection AddOpenFleetAuthorization(this IServiceCollection services)
    {
        services.AddSingleton<IAuthorizationHandler, MinimumRoleHandler>();

        services.AddAuthorization(options =>
        {
            options.AddPolicy(
                AuthorizationPolicies.AnyAuthenticated,
                policy => policy.Requirements.Add(new MinimumRoleRequirement(UserRole.Viewer)));

            options.AddPolicy(
                AuthorizationPolicies.TechnicianOrAbove,
                policy => policy.Requirements.Add(new MinimumRoleRequirement(UserRole.Technician)));

            options.AddPolicy(
                AuthorizationPolicies.FleetManagerOrAbove,
                policy => policy.Requirements.Add(new MinimumRoleRequirement(UserRole.FleetManager)));

            options.AddPolicy(
                AuthorizationPolicies.AdminOnly,
                policy => policy.Requirements.Add(new MinimumRoleRequirement(UserRole.Administrator)));
        });

        return services;
    }
}
