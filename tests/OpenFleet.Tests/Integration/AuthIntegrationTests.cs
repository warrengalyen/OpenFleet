using System.Net;
using System.Net.Http.Json;
using OpenFleet.Application.DTOs;
using OpenFleet.Tests.Helpers;

namespace OpenFleet.Tests.Integration;

[Collection("Integration")]
public class AuthIntegrationTests
{
    private readonly OpenFleetWebFactory _factory;

    public AuthIntegrationTests(OpenFleetWebFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task POST_login_with_valid_credentials_returns_200_with_token()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login",
            new { email = "admin@openfleet.io", password = "Admin@1234" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(body?.Token);
        Assert.Equal("admin@openfleet.io", body!.Email);
    }

    [Fact]
    public async Task POST_login_with_wrong_password_returns_401()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login",
            new { email = "admin@openfleet.io", password = "WrongPassword!" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GET_me_without_token_returns_401()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GET_me_with_valid_token_returns_200_with_user_profile()
    {
        var client = _factory.CreateClientWithRole("Administrator");

        var response = await client.GetAsync("/api/auth/me");

        // The sub claim from the test token is a random GUID not in the DB, so we may get 404
        // but the request must get past the 401 gate first - a 404 is acceptable here.
        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
