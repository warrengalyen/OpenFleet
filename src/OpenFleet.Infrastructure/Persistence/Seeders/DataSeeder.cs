using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;
using OpenFleet.Infrastructure.Persistence;

namespace OpenFleet.Infrastructure.Persistence.Seeders;

public static class DataSeeder
{
    public static async Task SeedAsync(OpenFleetDbContext context, ILogger logger)
    {
        if (await context.Departments.AnyAsync())
        {
            logger.LogInformation("Database already seeded. Skipping.");
            return;
        }

        logger.LogInformation("Seeding database...");

        var departments = new List<Department>
        {
            new() { Id = Guid.Parse("11111111-0000-0000-0000-000000000001"), Name = "Operations", Code = "OPS" },
            new() { Id = Guid.Parse("11111111-0000-0000-0000-000000000002"), Name = "Maintenance", Code = "MNT" },
            new() { Id = Guid.Parse("11111111-0000-0000-0000-000000000003"), Name = "Logistics", Code = "LOG" }
        };
        await context.Departments.AddRangeAsync(departments);
        await context.SaveChangesAsync();

        var users = new List<User>
        {
            new()
            {
                Id = Guid.Parse("22222222-0000-0000-0000-000000000001"),
                FirstName = "Alice", LastName = "Johnson",
                Email = "alice.johnson@openfleet.io",
                Role = UserRole.FleetManager,
                DepartmentId = departments[0].Id
            },
            new()
            {
                Id = Guid.Parse("22222222-0000-0000-0000-000000000002"),
                FirstName = "Bob", LastName = "Smith",
                Email = "bob.smith@openfleet.io",
                Role = UserRole.Technician,
                DepartmentId = departments[1].Id
            },
            new()
            {
                Id = Guid.Parse("22222222-0000-0000-0000-000000000003"),
                FirstName = "Carol", LastName = "Davis",
                Email = "carol.davis@openfleet.io",
                Role = UserRole.Supervisor,
                DepartmentId = departments[1].Id
            }
        };
        await context.Users.AddRangeAsync(users);
        await context.SaveChangesAsync();

        var vendors = new List<Vendor>
        {
            new()
            {
                Id = Guid.Parse("33333333-0000-0000-0000-000000000001"),
                Name = "AutoParts Direct", ContactName = "Mike Torres",
                Email = "sales@autopartsdirect.com", Phone = "555-0101",
                Address = "100 Industrial Blvd, Detroit, MI 48201"
            },
            new()
            {
                Id = Guid.Parse("33333333-0000-0000-0000-000000000002"),
                Name = "FleetSupply Co.", ContactName = "Sarah Lee",
                Email = "orders@fleetsupply.com", Phone = "555-0202",
                Address = "250 Commerce Ave, Chicago, IL 60601"
            }
        };
        await context.Vendors.AddRangeAsync(vendors);
        await context.SaveChangesAsync();

        var parts = new List<Part>
        {
            new()
            {
                Name = "Oil Filter", PartNumber = "OF-2024-STD",
                VendorId = vendors[0].Id, QuantityOnHand = 50, UnitCost = 12.99m
            },
            new()
            {
                Name = "Brake Pads (Front)", PartNumber = "BP-F-HD",
                VendorId = vendors[0].Id, QuantityOnHand = 20, UnitCost = 45.50m
            },
            new()
            {
                Name = "Air Filter", PartNumber = "AF-UNIV-01",
                VendorId = vendors[1].Id, QuantityOnHand = 35, UnitCost = 18.75m
            },
            new()
            {
                Name = "Wiper Blades Set", PartNumber = "WB-22IN-PR",
                VendorId = vendors[1].Id, QuantityOnHand = 40, UnitCost = 22.00m
            }
        };
        await context.Parts.AddRangeAsync(parts);
        await context.SaveChangesAsync();

        var vehicles = new List<Vehicle>
        {
            new()
            {
                Id = Guid.Parse("44444444-0000-0000-0000-000000000001"),
                VIN = "1HGBH41JXMN109186", LicensePlate = "OPS-001",
                Make = "Ford", Model = "F-150",
                Year = 2022, Mileage = 15023, Status = VehicleStatus.Active,
                DepartmentId = departments[0].Id
            },
            new()
            {
                Id = Guid.Parse("44444444-0000-0000-0000-000000000002"),
                VIN = "2T1BURHE0JC043821", LicensePlate = "OPS-002",
                Make = "Chevrolet", Model = "Silverado",
                Year = 2021, Mileage = 32100, Status = VehicleStatus.Active,
                DepartmentId = departments[0].Id
            },
            new()
            {
                Id = Guid.Parse("44444444-0000-0000-0000-000000000003"),
                VIN = "3VWFE21C04M000001", LicensePlate = "LOG-001",
                Make = "Ram", Model = "ProMaster",
                Year = 2020, Mileage = 48750, Status = VehicleStatus.InMaintenance,
                DepartmentId = departments[2].Id
            }
        };
        await context.Vehicles.AddRangeAsync(vehicles);
        await context.SaveChangesAsync();

        var workOrders = new List<WorkOrder>
        {
            new()
            {
                Title = "Oil Change & Filter Replacement",
                Description = "Routine oil change at 15,000 miles interval.",
                Status = WorkOrderStatus.Completed,
                Priority = WorkOrderPriority.Low,
                VehicleId = vehicles[0].Id,
                AssignedUserId = users[1].Id
            },
            new()
            {
                Title = "Front Brake Inspection",
                Description = "Driver reported brake squeal. Inspect and replace if worn.",
                Status = WorkOrderStatus.InProgress,
                Priority = WorkOrderPriority.High,
                VehicleId = vehicles[2].Id,
                AssignedUserId = users[1].Id
            }
        };
        await context.WorkOrders.AddRangeAsync(workOrders);
        await context.SaveChangesAsync();

        var notes = new List<WorkOrderNote>
        {
            new()
            {
                WorkOrderId = workOrders[0].Id,
                Content = "Oil change completed with synthetic 5W-30. Filter replaced.",
                AuthorName = "Bob Smith"
            },
            new()
            {
                WorkOrderId = workOrders[1].Id,
                Content = "Brake pads worn to 20%. Ordered replacement set from AutoParts Direct.",
                AuthorName = "Carol Davis"
            }
        };
        await context.WorkOrderNotes.AddRangeAsync(notes);
        await context.SaveChangesAsync();

        var maintenanceRecord = new MaintenanceRecord
        {
            WorkOrderId = workOrders[0].Id,
            PerformedAt = DateTime.UtcNow.AddDays(-10),
            OdometerReading = 15023,
            Notes = "Used synthetic 5W-30. Next service at 30,000 miles."
        };
        await context.MaintenanceRecords.AddAsync(maintenanceRecord);

        var inspection = new Inspection
        {
            VehicleId = vehicles[0].Id,
            InspectorUserId = users[2].Id,
            InspectedAt = DateTime.UtcNow.AddDays(-5),
            Passed = true,
            Notes = "All systems nominal. Tires at 35 PSI."
        };
        await context.Inspections.AddAsync(inspection);

        var assets = new List<Asset>
        {
            new()
            {
                AssetTag = "ASSET-001",
                Name = "Hydraulic Lift",
                Type = "Equipment",
                Condition = AssetCondition.Good,
                Status = AssetStatus.InUse,
                PurchaseDate = DateTime.UtcNow.AddYears(-2),
                DepartmentId = departments[1].Id
            },
            new()
            {
                AssetTag = "ASSET-002",
                Name = "GPS Tracker Unit",
                Type = "Electronics",
                Condition = AssetCondition.New,
                Status = AssetStatus.Available,
                PurchaseDate = DateTime.UtcNow.AddMonths(-3),
                DepartmentId = departments[0].Id,
                VehicleId = vehicles[0].Id
            }
        };
        await context.Assets.AddRangeAsync(assets);

        await context.SaveChangesAsync();
        logger.LogInformation("Database seeding complete.");
    }
}
