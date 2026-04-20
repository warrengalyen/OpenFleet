using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using OpenFleet.Api.Extensions;
using OpenFleet.Api.Middleware;
using OpenFleet.Infrastructure.Extensions;
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
        await db.Database.MigrateAsync();
        await DataSeeder.SeedAsync(db, seedLogger);
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
