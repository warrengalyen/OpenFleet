using Microsoft.Extensions.Configuration;
using OpenFleet.Infrastructure.Persistence;

namespace OpenFleet.Tests.Infrastructure;

public class PostgresConnectionStringNormalizerTests
{
    [Fact]
    public void Normalize_LeavesKeywordConnectionStringUnchanged()
    {
        const string input =
            "Host=db;Port=5432;Database=openfleet;Username=openfleet;Password=secret";

        var result = PostgresConnectionStringNormalizer.Normalize(input);

        Assert.Equal(input, result);
    }

    [Fact]
    public void Normalize_ConvertsPostgresqlUriAndExpandsRenderHost()
    {
        const string input =
            "postgresql://openfleet:s3cret%21@dpg-abc-a:5432/openfleet";

        var result = PostgresConnectionStringNormalizer.Normalize(input);

        Assert.Contains("Host=dpg-abc-a.oregon-postgres.render.com", result);
        Assert.Contains("Port=5432", result);
        Assert.Contains("Database=openfleet", result);
        Assert.Contains("Username=openfleet", result);
        Assert.Contains("Password=s3cret!", result);
        Assert.Contains("SSL Mode=Require", result, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("postgresql://", result);
    }

    [Fact]
    public void Normalize_AppliesSslModeFromQuery()
    {
        const string input =
            "postgres://user:pass@host.example.com:5432/db?sslmode=require";

        var result = PostgresConnectionStringNormalizer.Normalize(input);

        Assert.Contains("SSL Mode=Require", result, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Resolve_ExpandsShortRenderHostToExternalFqdn()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:Host"] = "dpg-abc-a",
                ["Database:Port"] = "5432",
                ["Database:Name"] = "openfleet",
                ["Database:User"] = "openfleet",
                ["Database:Password"] = "secret",
                ["Database:Region"] = "oregon",
                ["ConnectionStrings:DefaultConnection"] = "Host=ignored;Database=ignored",
            })
            .Build();

        var result = PostgresConnectionStringNormalizer.Resolve(config);

        Assert.Contains("Host=dpg-abc-a.oregon-postgres.render.com", result);
        Assert.Contains("Password=secret", result);
        Assert.Contains("SSL Mode=Require", result, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("ignored", result);
    }

    [Fact]
    public void ResolveRenderHost_LeavesFqdnUnchanged()
    {
        var (host, sslMode) = PostgresConnectionStringNormalizer.ResolveRenderHost(
            "dpg-abc-a.oregon-postgres.render.com",
            "oregon");

        Assert.Equal("dpg-abc-a.oregon-postgres.render.com", host);
        Assert.Equal(Npgsql.SslMode.Prefer, sslMode);
    }

    [Fact]
    public void Normalize_ThrowsWhenMissing()
    {
        Assert.ThrowsAny<ArgumentException>(() =>
            PostgresConnectionStringNormalizer.Normalize(null));
        Assert.ThrowsAny<ArgumentException>(() =>
            PostgresConnectionStringNormalizer.Normalize("   "));
    }
}
