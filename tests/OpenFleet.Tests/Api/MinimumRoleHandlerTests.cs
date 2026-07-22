using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using OpenFleet.Api.Authorization;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Tests.Api;

public class MinimumRoleHandlerTests
{
    private static AuthorizationHandlerContext CreateContext(
        UserRole minimumRole,
        string? roleClaim)
    {
        var requirements = new IAuthorizationRequirement[]
        {
            new MinimumRoleRequirement(minimumRole),
        };

        var identity = roleClaim is null
            ? new ClaimsIdentity()
            : new ClaimsIdentity(
                [new Claim(ClaimTypes.Role, roleClaim)],
                authenticationType: "Test");

        return new AuthorizationHandlerContext(
            requirements,
            new ClaimsPrincipal(identity),
            resource: null);
    }

    private static async Task<bool> EvaluateAsync(UserRole minimumRole, string? roleClaim)
    {
        var context = CreateContext(minimumRole, roleClaim);
        var handler = new MinimumRoleHandler();
        await handler.HandleAsync(context);
        return context.HasSucceeded;
    }

    [Theory]
    [InlineData("Viewer", true)]
    [InlineData("Technician", true)]
    [InlineData("Administrator", true)]
    [InlineData(null, false)]
    [InlineData("NotARole", false)]
    public async Task AnyAuthenticated_requires_Viewer_or_above(string? role, bool expected)
    {
        Assert.Equal(expected, await EvaluateAsync(UserRole.Viewer, role));
    }

    [Theory]
    [InlineData("Viewer", false)]
    [InlineData("Technician", true)]
    [InlineData("Supervisor", true)]
    [InlineData("FleetManager", true)]
    [InlineData("Administrator", true)]
    public async Task TechnicianOrAbove_denies_Viewer(string role, bool expected)
    {
        Assert.Equal(expected, await EvaluateAsync(UserRole.Technician, role));
    }

    [Theory]
    [InlineData("Technician", false)]
    [InlineData("Supervisor", false)]
    [InlineData("FleetManager", true)]
    [InlineData("Administrator", true)]
    public async Task FleetManagerOrAbove_denies_Technician_and_Supervisor(string role, bool expected)
    {
        Assert.Equal(expected, await EvaluateAsync(UserRole.FleetManager, role));
    }

    [Theory]
    [InlineData("FleetManager", false)]
    [InlineData("Administrator", true)]
    public async Task AdminOnly_requires_Administrator(string role, bool expected)
    {
        Assert.Equal(expected, await EvaluateAsync(UserRole.Administrator, role));
    }

    [Fact]
    public async Task Role_claim_is_parsed_case_insensitively()
    {
        Assert.True(await EvaluateAsync(UserRole.Technician, "technician"));
    }
}
