namespace OpenFleet.Application.Common;

/// <summary>
/// Named ASP.NET Core authorization policy names used with [Authorize(Policy = "...")].
/// Registered in the API via MinimumRoleRequirement handlers; names align with frontend AuthPolicy.
/// </summary>
public static class AuthorizationPolicies
{
    public const string AnyAuthenticated = "AnyAuthenticated";
    public const string TechnicianOrAbove = "TechnicianOrAbove";
    public const string FleetManagerOrAbove = "FleetManagerOrAbove";
    public const string AdminOnly = "AdminOnly";
}
