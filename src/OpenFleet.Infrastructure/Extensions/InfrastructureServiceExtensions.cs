using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenFleet.Application.Interfaces;
using OpenFleet.Infrastructure.Persistence;

namespace OpenFleet.Infrastructure.Extensions;

public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<OpenFleetDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(OpenFleetDbContext).Assembly.FullName)));

        services.AddScoped<IOpenFleetDbContext>(sp =>
            sp.GetRequiredService<OpenFleetDbContext>());

        return services;
    }
}
