using System.Net;
using OpenFleet.Tests.Helpers;

namespace OpenFleet.Tests.Integration;

[Collection("Integration")]
public class NotificationsHubIntegrationTests
{
    private readonly OpenFleetWebFactory _factory;

    public NotificationsHubIntegrationTests(OpenFleetWebFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Negotiate_without_token_returns_401()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsync("/hubs/notifications/negotiate?negotiateVersion=1", null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Negotiate_with_viewer_token_returns_200()
    {
        var client = _factory.CreateClientWithRole("Viewer");
        var response = await client.PostAsync("/hubs/notifications/negotiate?negotiateVersion=1", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("connectionToken", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Negotiate_with_access_token_query_returns_200()
    {
        var token = TestJwtHelper.GenerateToken("Viewer");
        var client = _factory.CreateClient();
        var response = await client.PostAsync(
            $"/hubs/notifications/negotiate?negotiateVersion=1&access_token={Uri.EscapeDataString(token)}",
            null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
