using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
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

    // Render provides Database__* parts (preferred) or a postgresql:// URI.
    var connectionString = PostgresConnectionStringNormalizer.Resolve(builder.Configuration);
    builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString;
    Log.Information(
        "PostgreSQL host configured as {Host}",
        new Npgsql.NpgsqlConnectionStringBuilder(connectionString).Host);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console());

    builder.Services.AddControllers();
    builder.Services.AddFluentValidationAutoValidation();
    builder.Services.AddValidatorsFromAssemblyContaining<CreateVehicleRequestValidator>();

    // Enrich validation error responses with the request's correlation ID
    builder.Services.Configure<ApiBehaviorOptions>(options =>
    {
        options.InvalidModelStateResponseFactory = ctx =>
        {
            var correlationId = ctx.HttpContext.Items[CorrelationIdMiddleware.ItemsKey]?.ToString();
            var problem = new ValidationProblemDetails(ctx.ModelState)
            {
                Type = "https://httpstatuses.io/400",
                Title = "One or more validation errors occurred.",
                Status = StatusCodes.Status400BadRequest,
                Instance = ctx.HttpContext.Request.Path
            };
            if (correlationId is not null)
                problem.Extensions["correlationId"] = correlationId;
            return new BadRequestObjectResult(problem);
        };
    });
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

    builder.Services.AddScoped<ApplicationSettingsService>();
    builder.Services.AddScoped<IApplicationSettingsProvider>(sp =>
        sp.GetRequiredService<ApplicationSettingsService>());
    builder.Services.AddScoped<AuditService>();
    builder.Services.AddScoped<ReportingService>();
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

    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? [];
    // Local Vite defaults when nothing is configured (e.g. plain docker compose).
    if (allowedOrigins.Length == 0 && builder.Environment.IsDevelopment())
    {
        allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
    }

    if (allowedOrigins.Length > 0)
    {
        builder.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
                policy.WithOrigins(allowedOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod());
        });
    }

    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });

    builder.Services.AddHealthChecks()
        .AddNpgSql(
            builder.Configuration.GetConnectionString("DefaultConnection")!,
            name: "postgres",
            failureStatus: HealthStatus.Unhealthy,
            tags: ["db", "postgres"]);

    var app = builder.Build();

    app.UseForwardedHeaders();
    app.UseMiddleware<CorrelationIdMiddleware>();
    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseSerilogRequestLogging();

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
    if (allowedOrigins.Length > 0)
        app.UseCors();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    static Task WriteHealthResponse(HttpContext context,
        Microsoft.Extensions.Diagnostics.HealthChecks.HealthReport report)
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
        return context.Response.WriteAsync(result);
    }

    // Combined health check - backward-compatible
    app.MapHealthChecks("/health", new HealthCheckOptions
    {
        ResponseWriter = WriteHealthResponse
    });

    // Liveness probe - always 200 while the process is alive (no DB dependency)
    app.MapHealthChecks("/health/live", new HealthCheckOptions
    {
        Predicate = _ => false, // skip all registered checks
        ResponseWriter = WriteHealthResponse
    });

    // Readiness probe - requires PostgreSQL to be healthy
    app.MapHealthChecks("/health/ready", new HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("db"),
        ResponseWriter = WriteHealthResponse
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
