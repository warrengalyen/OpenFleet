using Microsoft.Extensions.Configuration;
using Npgsql;

namespace OpenFleet.Infrastructure.Persistence;

/// <summary>
/// Builds an Npgsql keyword connection string from discrete Database__* settings
/// (preferred on Render) or by normalizing a postgres:// URI.
/// </summary>
public static class PostgresConnectionStringNormalizer
{
    public static string Resolve(IConfiguration configuration)
    {
        var host = configuration["Database:Host"];
        if (!string.IsNullOrWhiteSpace(host))
        {
            var region = configuration["Database:Region"] ?? "oregon";
            var (resolvedHost, sslMode) = ResolveRenderHost(host, region);

            var builder = new NpgsqlConnectionStringBuilder
            {
                Host = resolvedHost,
                Port = int.TryParse(configuration["Database:Port"], out var port) ? port : 5432,
                Database = configuration["Database:Name"] ?? "openfleet",
                Username = configuration["Database:User"] ?? "openfleet",
                Password = configuration["Database:Password"] ?? string.Empty,
                SslMode = sslMode,
            };
            return builder.ConnectionString;
        }

        return Normalize(configuration.GetConnectionString("DefaultConnection"));
    }

    /// <summary>
    /// Render's fromDatabase host is a short private name (dpg-…-a) that only
    /// resolves on the private network. Free/Docker deploys often can't resolve
    /// it, so expand to the public *.region-postgres.render.com hostname.
    /// </summary>
    public static (string Host, SslMode SslMode) ResolveRenderHost(string host, string region)
    {
        if (host.Contains('.', StringComparison.Ordinal))
            return (host, SslMode.Prefer);

        if (host.StartsWith("dpg-", StringComparison.OrdinalIgnoreCase))
        {
            var externalHost = $"{host}.{region}-postgres.render.com";
            return (externalHost, SslMode.Require);
        }

        return (host, SslMode.Prefer);
    }

    public static string Normalize(string? connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);

        if (!connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
            && !connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            return connectionString;
        }

        var uri = new Uri(connectionString);
        var userInfo = uri.UserInfo.Split(':', 2);
        var (host, sslMode) = ResolveRenderHost(uri.Host, "oregon");
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = host,
            Port = uri.IsDefaultPort || uri.Port < 0 ? 5432 : uri.Port,
            Username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : string.Empty,
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            SslMode = sslMode,
        };

        foreach (var part in uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var kv = part.Split('=', 2);
            var key = Uri.UnescapeDataString(kv[0]);
            var value = kv.Length > 1 ? Uri.UnescapeDataString(kv[1]) : string.Empty;

            switch (key.ToLowerInvariant())
            {
                case "sslmode":
                    builder.SslMode = value.ToLowerInvariant() switch
                    {
                        "disable" => SslMode.Disable,
                        "allow" => SslMode.Allow,
                        "prefer" => SslMode.Prefer,
                        "require" => SslMode.Require,
                        "verify-ca" => SslMode.VerifyCA,
                        "verify-full" => SslMode.VerifyFull,
                        _ => Enum.Parse<SslMode>(value, ignoreCase: true),
                    };
                    break;
            }
        }

        return builder.ConnectionString;
    }
}
