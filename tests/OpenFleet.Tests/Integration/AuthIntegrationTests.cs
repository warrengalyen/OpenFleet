using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Services;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;
using OpenFleet.Infrastructure.Persistence;
using OpenFleet.Tests.Helpers;

namespace OpenFleet.Tests.Integration;

[Collection("Integration")]
public class AuthIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

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
        Assert.False(body.IsDemoUser);
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

    [Fact]
    public async Task PUT_profile_demo_user_returns_403_problem_details()
    {
        var demoUserId = await EnsureDemoUserAsync();
        var client = _factory.CreateClientWithRole("Viewer", demoUserId);

        var response = await client.PutAsJsonAsync("/api/auth/profile",
            new { firstName = "Hacked", lastName = "Name" });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsDto>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("Demo account restriction", problem!.Title);
        Assert.Equal(AuthService.DemoProfileRestrictionDetail, problem.Detail);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OpenFleetDbContext>();
        var stored = await db.Users.AsNoTracking().FirstAsync(u => u.Id == demoUserId);
        Assert.Equal("Dana", stored.FirstName);
        Assert.Equal("Nguyen", stored.LastName);
    }

    [Fact]
    public async Task PUT_profile_demo_user_password_change_returns_403()
    {
        var demoUserId = await EnsureDemoUserAsync();
        var client = _factory.CreateClientWithRole("Viewer", demoUserId);

        string originalHash;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<OpenFleetDbContext>();
            originalHash = (await db.Users.AsNoTracking().FirstAsync(u => u.Id == demoUserId)).PasswordHash;
        }

        var response = await client.PutAsJsonAsync("/api/auth/profile",
            new { currentPassword = "Viewer@1234", newPassword = "Hacked@1234" });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsDto>(JsonOptions);
        Assert.Equal(AuthService.DemoPasswordRestrictionDetail, problem!.Detail);

        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<OpenFleetDbContext>();
        var stored = await verifyDb.Users.AsNoTracking().FirstAsync(u => u.Id == demoUserId);
        Assert.Equal(originalHash, stored.PasswordHash);
    }

    [Fact]
    public async Task GET_me_includes_is_demo_user_for_demo_account()
    {
        var demoUserId = await EnsureDemoUserAsync();
        var client = _factory.CreateClientWithRole("Viewer", demoUserId);

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<CurrentUserResponse>();
        Assert.NotNull(body);
        Assert.True(body!.IsDemoUser);
    }

    private async Task<Guid> EnsureDemoUserAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OpenFleetDbContext>();

        var existing = await db.Users.FirstOrDefaultAsync(u => u.Email == "viewer@openfleet.io");
        if (existing is not null)
        {
            if (!existing.IsDemoUser)
            {
                existing.IsDemoUser = true;
                await db.SaveChangesAsync();
            }
            return existing.Id;
        }

        var deptId = await db.Departments.Select(d => d.Id).FirstAsync();
        var user = new User
        {
            Id = Guid.Parse("22222222-0000-0000-0000-000000000005"),
            FirstName = "Dana",
            LastName = "Nguyen",
            Email = "viewer@openfleet.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Viewer@1234"),
            Role = UserRole.Viewer,
            IsActive = true,
            IsDemoUser = true,
            DepartmentId = deptId
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user.Id;
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

    private sealed record ProblemDetailsDto(string? Title, string? Detail, int? Status);
}
