using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using OpenFleet.Infrastructure.Persistence;

namespace OpenFleet.Tests.Helpers;

/// <summary>
/// Shared factory for integration tests. Replaces the real database with an in-memory one
/// and suppresses Serilog to avoid static-logger conflicts when multiple test classes use it.
/// </summary>
public class OpenFleetWebFactory : WebApplicationFactory<Program>
{
    internal const string TestJwtSecret = "OpenFleet-Dev-Secret-Key-Min-32-Chars!!";
    internal const string TestJwtIssuer = "OpenFleet.Api";
    internal const string TestJwtAudience = "OpenFleet.Clients";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureLogging(logging => logging.ClearProviders());

        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<OpenFleetDbContext>));
            if (descriptor is not null)
                services.Remove(descriptor);

            services.AddDbContext<OpenFleetDbContext>(options =>
                options.UseInMemoryDatabase("OpenFleetIntegrationTestDb"));
        });
    }

    /// <summary>
    /// Creates an HttpClient with a pre-attached JWT bearer token for the specified role.
    /// Uses the same secret/issuer/audience as the test appsettings so the middleware accepts it.
    /// </summary>
    public HttpClient CreateClientWithRole(string role, Guid? userId = null)
    {
        var token = TestJwtHelper.GenerateToken(role, userId ?? Guid.NewGuid());
        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}

public static class TestJwtHelper
{
    public static string GenerateToken(string role, Guid? userId = null, string email = "test@openfleet.io")
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(OpenFleetWebFactory.TestJwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, (userId ?? Guid.NewGuid()).ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: OpenFleetWebFactory.TestJwtIssuer,
            audience: OpenFleetWebFactory.TestJwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

[CollectionDefinition("Integration")]
public class IntegrationCollectionDefinition : ICollectionFixture<OpenFleetWebFactory> { }
