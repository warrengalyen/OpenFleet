using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OpenFleet.Infrastructure.Persistence;

namespace OpenFleet.Tests.Helpers;

/// <summary>
/// Shared factory for integration tests. Replaces the real database with an in-memory one
/// and suppresses Serilog to avoid static-logger conflicts when multiple test classes use it.
/// </summary>
public class OpenFleetWebFactory : WebApplicationFactory<Program>
{
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
}

[CollectionDefinition("Integration")]
public class IntegrationCollectionDefinition : ICollectionFixture<OpenFleetWebFactory> { }
