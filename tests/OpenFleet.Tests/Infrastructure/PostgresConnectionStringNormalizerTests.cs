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
    public void Normalize_ConvertsPostgresqlUriToKeywordForm()
    {
        const string input =
            "postgresql://openfleet:s3cret%21@dpg-abc-a:5432/openfleet";

        var result = PostgresConnectionStringNormalizer.Normalize(input);

        Assert.Contains("Host=dpg-abc-a", result);
        Assert.Contains("Port=5432", result);
        Assert.Contains("Database=openfleet", result);
        Assert.Contains("Username=openfleet", result);
        Assert.Contains("Password=s3cret!", result);
        Assert.DoesNotContain("postgresql://", result);
    }

    [Fact]
    public void Normalize_AppliesSslModeFromQuery()
    {
        const string input =
            "postgres://user:pass@host:5432/db?sslmode=require";

        var result = PostgresConnectionStringNormalizer.Normalize(input);

        Assert.Contains("SSL Mode=Require", result, StringComparison.OrdinalIgnoreCase);
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
