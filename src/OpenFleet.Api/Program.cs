using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using OpenFleet.Api.Extensions;
using OpenFleet.Api.Middleware;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using OpenFleet.Application.Common;
using OpenFleet.Application.Interfaces;
using OpenFleet.Application.Services;
using OpenFleet.Application.Validators;
using OpenFleet.Infrastructure.BackgroundServices;
using OpenFleet.Infrastructure.Extensions;
using OpenFleet.Infrastructure.Integrations;
using OpenFleet.Infrastructure.Persistence;
using OpenFleet.Infrastructure.Persistence.Seeders;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console());

    builder.Services.AddControllers();
    builder.Services.AddFluentValidationAutoValidation();
    builder.Services.AddValidatorsFromAssemblyContaining<CreateVehicleRequestValidator>();
    builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

    var jwtSecret = builder.Configuration["Jwt:Secret"]
        ?? throw new InvalidOperationException("Jwt:Secret is not configured.");
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidAudience = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
            };
        });
    builder.Services.AddAuthorization();

    builder.Services.AddScoped<AuditService>();
    builder.Services.AddScoped<WorkOrderService>();
    builder.Services.AddScoped<InspectionService>();
    builder.Services.AddScoped<MaintenanceScheduleService>();
    builder.Services.AddScoped<IntegrationLogService>();
    builder.Services.AddScoped<UserManagementService>();
    builder.Services.AddScoped<AuthService>();
    builder.Services.AddScoped<IExternalIntegrationConnector, FuelUsageConnector>();
    builder.Services.AddScoped<IExternalIntegrationConnector, VendorRepairConnector>();
    builder.Services.AddScoped<IExternalIntegrationConnector, PartsSupplierConnector>();
    builder.Services.AddScoped<IExternalIntegrationConnector, ExternalAssetConnector>();
    builder.Services.AddHostedService<MaintenanceDueCheckerService>();
    builder.Services.AddHostedService<IntegrationSyncService>();
    builder.Services.AddSwagger();
    builder.Services.AddInfrastructure(builder.Configuration);

    builder.Services.AddHealthChecks()
        .AddNpgSql(
            builder.Configuration.GetConnectionString("DefaultConnection")!,
            name: "postgres",
            failureStatus: HealthStatus.Unhealthy,
            tags: ["db", "postgres"]);

    var app = builder.Build();

    app.UseMiddleware<ExceptionHandlingMiddleware>();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "OpenFleet API v1");
            c.RoutePrefix = string.Empty;
        });
    }

    app.UseHttpsRedirection();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHealthChecks("/health", new HealthCheckOptions
    {
        ResponseWriter = async (context, report) =>
        {
            context.Response.ContentType = "application/json";
            var result = System.Text.Json.JsonSerializer.Serialize(new
            {
                status = report.Status.ToString(),
                checks = report.Entries.Select(e => new
                {
                    name = e.Key,
                    status = e.Value.Status.ToString(),
                    description = e.Value.Description
                })
            });
            await context.Response.WriteAsync(result);
        }
    });

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<OpenFleetDbContext>();
        var seedLogger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        if (db.Database.IsRelational())
        {
            await db.Database.MigrateAsync();
            await DataSeeder.SeedAsync(db, seedLogger);
        }
        else
        {
            await db.Database.EnsureCreatedAsync();
        }
    }

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program { }
