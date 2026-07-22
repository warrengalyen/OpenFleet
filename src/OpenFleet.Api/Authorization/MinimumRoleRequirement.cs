using Microsoft.AspNetCore.Authorization;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Api.Authorization;

/// <summary>
/// Requires the caller's role to be at least <see cref="MinimumRole"/> in the UserRole hierarchy.
/// </summary>
public sealed class MinimumRoleRequirement(UserRole minimumRole) : IAuthorizationRequirement
{
    public UserRole MinimumRole { get; } = minimumRole;
}
