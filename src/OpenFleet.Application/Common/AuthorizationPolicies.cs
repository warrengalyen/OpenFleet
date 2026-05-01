namespace OpenFleet.Application.Common;

/// <summary>
/// Role strings used with [Authorize(Roles = "...")] across controllers.
/// These correspond directly to OpenFleet.Domain.Enums.UserRole values.
/// </summary>
public static class AuthorizationPolicies
{
    public const string AdminOnly = "Administrator";
    public const string FleetManagerOrAbove = "FleetManager,Administrator";
    public const string TechnicianOrAbove = "Technician,Supervisor,FleetManager,Administrator";
    public const string AnyAuthenticated = "Viewer,Technician,Supervisor,FleetManager,Administrator";
}
