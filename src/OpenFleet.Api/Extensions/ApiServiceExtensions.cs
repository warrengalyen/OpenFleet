using System.Reflection;

namespace OpenFleet.Api.Extensions;

public static class ApiServiceExtensions
{
    public static IServiceCollection AddSwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
            {
                Title = "OpenFleet API",
                Version = "v1",
                Description = "Fleet and maintenance management system API",
                Contact = new Microsoft.OpenApi.Models.OpenApiContact
                {
                    Name = "OpenFleet",
                    Email = "support@openfleet.io"
                }
            });

            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath))
                options.IncludeXmlComments(xmlPath);
        });

        return services;
    }
}
