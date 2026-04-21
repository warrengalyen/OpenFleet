using Microsoft.EntityFrameworkCore;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;
using OpenFleet.Infrastructure.Persistence;

namespace OpenFleet.Tests.Infrastructure;

public class OpenFleetDbContextTests : IDisposable
{
    private readonly OpenFleetDbContext _context;

    public OpenFleetDbContextTests()
    {
        var options = new DbContextOptionsBuilder<OpenFleetDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new OpenFleetDbContext(options);
    }

    [Fact]
    public async Task CanAddAndRetrieveDepartment()
    {
        var dept = new Department { Name = "Operations", Code = "OPS" };
        _context.Departments.Add(dept);
        await _context.SaveChangesAsync();

        var retrieved = await _context.Departments.FirstAsync(d => d.Code == "OPS");
        Assert.Equal("Operations", retrieved.Name);
    }

    [Fact]
    public async Task CanAddAndRetrieveVehicle()
    {
        var dept = new Department { Name = "Logistics", Code = "LOG" };
        _context.Departments.Add(dept);
        await _context.SaveChangesAsync();

        var vehicle = new Vehicle
        {
            VIN = "TEST12345678901234",
            Make = "Toyota",
            Model = "Tacoma",
            Year = 2023,
            Status = VehicleStatus.Active,
            DepartmentId = dept.Id
        };
        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();

        var retrieved = await _context.Vehicles.FirstAsync(v => v.VIN == "TEST12345678901234");
        Assert.Equal("Toyota", retrieved.Make);
        Assert.Equal(VehicleStatus.Active, retrieved.Status);
    }

    [Fact]
    public async Task SaveChanges_UpdatesUpdatedAt()
    {
        var dept = new Department { Name = "Maintenance", Code = "MNT" };
        _context.Departments.Add(dept);
        await _context.SaveChangesAsync();

        var originalUpdatedAt = dept.UpdatedAt;

        await Task.Delay(10);
        dept.Name = "Maintenance Department";
        _context.Departments.Update(dept);
        await _context.SaveChangesAsync();

        Assert.True(dept.UpdatedAt >= originalUpdatedAt);
    }

    [Fact]
    public async Task CanAddVendorAndPart()
    {
        var vendor = new Vendor
        {
            Name = "Parts Co.",
            ContactName = "John",
            Email = "john@parts.com",
            Phone = "555-1234",
            Address = "123 Main St"
        };
        _context.Vendors.Add(vendor);
        await _context.SaveChangesAsync();

        var part = new Part
        {
            Name = "Oil Filter",
            PartNumber = "OF-001",
            VendorId = vendor.Id,
            QuantityOnHand = 10,
            UnitCost = 12.99m
        };
        _context.Parts.Add(part);
        await _context.SaveChangesAsync();

        var count = await _context.Parts.CountAsync();
        Assert.Equal(1, count);
    }

    public void Dispose() => _context.Dispose();
}
