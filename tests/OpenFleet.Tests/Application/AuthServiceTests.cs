using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OpenFleet.Application.Common;
using OpenFleet.Application.DTOs;
using OpenFleet.Application.Services;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;
using OpenFleet.Infrastructure.Persistence;

namespace OpenFleet.Tests.Application;

public class AuthServiceTests : IDisposable
{
    private readonly OpenFleetDbContext _context;
    private readonly AuthService _service;
    private static readonly Guid AdminDeptId = Guid.NewGuid();

    public AuthServiceTests()
    {
        var options = new DbContextOptionsBuilder<OpenFleetDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new OpenFleetDbContext(options);

        var jwtSettings = Options.Create(new JwtSettings
        {
            Secret = "OpenFleet-Unit-Test-Secret-Min-32-Chars",
            Issuer = "OpenFleet.Api",
            Audience = "OpenFleet.Clients",
            ExpiryHours = 1
        });

        _service = new AuthService(_context, jwtSettings);
        SeedUsers();
    }

    public void Dispose() => _context.Dispose();

    private void SeedUsers()
    {
        var dept = new Department { Id = AdminDeptId, Name = "IT" };
        _context.Departments.Add(dept);

        _context.Users.AddRange(
            new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Admin",
                LastName = "User",
                Email = "admin@openfleet.io",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234"),
                Role = UserRole.Administrator,
                IsActive = true,
                DepartmentId = AdminDeptId
            },
            new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Inactive",
                LastName = "User",
                Email = "inactive@openfleet.io",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Fleet@1234"),
                Role = UserRole.Viewer,
                IsActive = false,
                DepartmentId = AdminDeptId
            }
        );
        _context.SaveChanges();
    }

    [Fact]
    public async Task LoginAsync_valid_credentials_returns_token()
    {
        var result = await _service.LoginAsync(new LoginRequest("admin@openfleet.io", "Admin@1234"));

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value!.Token);
        Assert.Equal("admin@openfleet.io", result.Value.Email);
        Assert.Equal(UserRole.Administrator, result.Value.Role);
        Assert.True(result.Value.ExpiresAt > DateTime.UtcNow);
    }

    [Fact]
    public async Task LoginAsync_wrong_password_returns_failure()
    {
        var result = await _service.LoginAsync(new LoginRequest("admin@openfleet.io", "WrongPass!"));

        Assert.False(result.IsSuccess);
        Assert.NotNull(result.Error);
    }

    [Fact]
    public async Task LoginAsync_unknown_email_returns_failure()
    {
        var result = await _service.LoginAsync(new LoginRequest("ghost@openfleet.io", "Whatever1!"));

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public async Task LoginAsync_inactive_user_returns_failure()
    {
        var result = await _service.LoginAsync(new LoginRequest("inactive@openfleet.io", "Fleet@1234"));

        Assert.False(result.IsSuccess);
        Assert.Contains("inactive", result.Error!, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetCurrentUserAsync_returns_profile_for_existing_user()
    {
        var user = await _context.Users.FirstAsync(u => u.Email == "admin@openfleet.io");

        var profile = await _service.GetCurrentUserAsync(user.Id);

        Assert.NotNull(profile);
        Assert.Equal("admin@openfleet.io", profile!.Email);
        Assert.Equal(UserRole.Administrator, profile.Role);
    }

    [Fact]
    public async Task GetCurrentUserAsync_returns_null_for_unknown_id()
    {
        var profile = await _service.GetCurrentUserAsync(Guid.NewGuid());

        Assert.Null(profile);
    }
}
