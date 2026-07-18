using System.Net;
using System.Net.Http.Headers;
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
        var client = await CreateAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<CurrentUserResponse>();
        Assert.NotNull(body);
        Assert.Equal("admin@openfleet.io", body!.Email);
        Assert.Equal("Admin", body.FirstName);
        Assert.Equal("User", body.LastName);
        Assert.Equal("Admin User", body.FullName);
    }

    [Fact]
    public async Task PUT_profile_without_token_returns_401()
    {
        var client = _factory.CreateClient();

        var response = await client.PutAsJsonAsync("/api/auth/profile",
            new { firstName = "New", lastName = "Name" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task PUT_profile_updates_display_name()
    {
        var client = await CreateAuthenticatedClientAsync();

        var response = await client.PutAsJsonAsync("/api/auth/profile",
            new { firstName = "Updated", lastName = "Admin" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<CurrentUserResponse>();
        Assert.NotNull(body);
        Assert.Equal("Updated", body!.FirstName);
        Assert.Equal("Admin", body.LastName);
        Assert.Equal("Updated Admin", body.FullName);

        // Restore seed name so other tests stay stable on shared in-memory DB
        await client.PutAsJsonAsync("/api/auth/profile",
            new { firstName = "Admin", lastName = "User" });
    }

    [Fact]
    public async Task PUT_profile_with_wrong_current_password_returns_400()
    {
        var client = await CreateAuthenticatedClientAsync();

        var response = await client.PutAsJsonAsync("/api/auth/profile",
            new { currentPassword = "WrongPassword!", newPassword = "Another@1234" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task<HttpClient> CreateAuthenticatedClientAsync()
    {
        var client = _factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login",
            new { email = "admin@openfleet.io", password = "Admin@1234" });
        login.EnsureSuccessStatusCode();

        var body = await login.Content.ReadFromJsonAsync<LoginResponse>();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", body!.Token);
        return client;
    }
}
