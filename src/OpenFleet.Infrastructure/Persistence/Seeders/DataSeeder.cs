using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OpenFleet.Application.Services;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;
using OpenFleet.Infrastructure.Persistence;
using BcryptNet = BCrypt.Net.BCrypt;

namespace OpenFleet.Infrastructure.Persistence.Seeders;

public static class DataSeeder
{
    public static async Task SeedAsync(OpenFleetDbContext context, ILogger logger)
    {
        await ApplicationSettingsService.EnsureDefaultsAsync(context);

        if (await context.Departments.AnyAsync())
        {
            logger.LogInformation("Database already seeded. Ensuring parts and vendors demo data...");
            await EnsureInventorySeedDataAsync(context, logger);
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
                PasswordHash = BcryptNet.HashPassword("Fleet@1234"),
                Role = UserRole.FleetManager,
                IsActive = true,
                DepartmentId = departments[0].Id
            },
            new()
            {
                Id = Guid.Parse("22222222-0000-0000-0000-000000000002"),
                FirstName = "Bob", LastName = "Smith",
                Email = "bob.smith@openfleet.io",
                PasswordHash = BcryptNet.HashPassword("Fleet@1234"),
                Role = UserRole.Technician,
                IsActive = true,
                DepartmentId = departments[1].Id
            },
            new()
            {
                Id = Guid.Parse("22222222-0000-0000-0000-000000000003"),
                FirstName = "Carol", LastName = "Davis",
                Email = "carol.davis@openfleet.io",
                PasswordHash = BcryptNet.HashPassword("Fleet@1234"),
                Role = UserRole.Supervisor,
                IsActive = true,
                DepartmentId = departments[1].Id
            },
            new()
            {
                Id = Guid.Parse("22222222-0000-0000-0000-000000000004"),
                FirstName = "Admin", LastName = "User",
                Email = "admin@openfleet.io",
                PasswordHash = BcryptNet.HashPassword("Admin@1234"),
                Role = UserRole.Administrator,
                IsActive = true,
                DepartmentId = departments[0].Id
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
            },
            new()
            {
                Name = "Spark Plugs (Set of 4)", PartNumber = "SP-4PK-IR",
                VendorId = vendors[0].Id, QuantityOnHand = 18, UnitCost = 32.50m
            },
            new()
            {
                Name = "Coolant (1 Gallon)", PartNumber = "CL-50-50-GAL",
                VendorId = vendors[1].Id, QuantityOnHand = 12, UnitCost = 24.99m
            },
            new()
            {
                Name = "Headlight Bulb H11", PartNumber = "HB-H11-LED",
                VendorId = vendors[0].Id, QuantityOnHand = 0, UnitCost = 38.00m
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
                Id = Guid.Parse("55555555-0000-0000-0000-000000000001"),
                Title = "Oil Change & Filter Replacement",
                Description = "Routine oil change at 15,000 miles interval.",
                Status = WorkOrderStatus.Completed,
                Priority = WorkOrderPriority.Low,
                LaborHours = 1.5m,
                CompletedAt = DateTime.UtcNow.AddDays(-10),
                VehicleId = vehicles[0].Id,
                AssignedUserId = users[1].Id
            },
            new()
            {
                Id = Guid.Parse("55555555-0000-0000-0000-000000000002"),
                Title = "Front Brake Inspection",
                Description = "Driver reported brake squeal. Inspect and replace if worn.",
                Status = WorkOrderStatus.InProgress,
                Priority = WorkOrderPriority.High,
                LaborHours = 2.0m,
                VehicleId = vehicles[2].Id,
                AssignedUserId = users[1].Id
            },
            new()
            {
                Id = Guid.Parse("55555555-0000-0000-0000-000000000003"),
                Title = "Tire Rotation",
                Description = "Rotate all four tires to ensure even wear.",
                Status = WorkOrderStatus.Open,
                Priority = WorkOrderPriority.Low,
                VehicleId = vehicles[1].Id,
                AssignedUserId = users[1].Id
            },
            new()
            {
                Id = Guid.Parse("55555555-0000-0000-0000-000000000004"),
                Title = "Transmission Service",
                Description = "Flush transmission fluid and replace filter.",
                Status = WorkOrderStatus.WaitingForParts,
                Priority = WorkOrderPriority.Medium,
                LaborHours = 1.0m,
                VehicleId = vehicles[1].Id,
                AssignedUserId = users[1].Id
            },
            new()
            {
                Id = Guid.Parse("55555555-0000-0000-0000-000000000005"),
                Title = "Engine Diagnostic",
                Description = "Check engine light is on. Run full OBD-II diagnostic.",
                Status = WorkOrderStatus.Open,
                Priority = WorkOrderPriority.Critical,
                VehicleId = vehicles[2].Id,
                AssignedUserId = users[2].Id
            },
            new()
            {
                Id = Guid.Parse("55555555-0000-0000-0000-000000000006"),
                Title = "Annual Safety Inspection",
                Description = "State-mandated annual vehicle safety inspection.",
                Status = WorkOrderStatus.Completed,
                Priority = WorkOrderPriority.High,
                LaborHours = 3.5m,
                CompletedAt = DateTime.UtcNow.AddDays(-60),
                VehicleId = vehicles[0].Id,
                AssignedUserId = users[2].Id
            },
            new()
            {
                Id = Guid.Parse("55555555-0000-0000-0000-000000000007"),
                Title = "Cooling System Flush",
                Description = "Flush and refill coolant. Inspect hoses and thermostat.",
                Status = WorkOrderStatus.Completed,
                Priority = WorkOrderPriority.Medium,
                LaborHours = 2.5m,
                CompletedAt = DateTime.UtcNow.AddDays(-30),
                VehicleId = vehicles[1].Id,
                AssignedUserId = users[1].Id
            },
            new()
            {
                Id = Guid.Parse("55555555-0000-0000-0000-000000000008"),
                Title = "Wiper Blade Replacement",
                Description = "Front and rear wiper blades worn. Replace set.",
                Status = WorkOrderStatus.Cancelled,
                Priority = WorkOrderPriority.Low,
                VehicleId = vehicles[0].Id,
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
            },
            new()
            {
                WorkOrderId = workOrders[4].Id,
                Content = "P0420 fault code detected. Catalyst efficiency below threshold.",
                AuthorName = "Bob Smith"
            }
        };
        await context.WorkOrderNotes.AddRangeAsync(notes);
        await context.SaveChangesAsync();

        var maintenanceRecords = new List<MaintenanceRecord>
        {
            new()
            {
                WorkOrderId = workOrders[0].Id,
                PerformedAt = DateTime.UtcNow.AddDays(-10),
                OdometerReading = 15023,
                Notes = "Used synthetic 5W-30. Next service at 30,000 miles."
            },
            new()
            {
                WorkOrderId = workOrders[5].Id,
                PerformedAt = DateTime.UtcNow.AddDays(-60),
                OdometerReading = 14500,
                Notes = "Safety inspection passed. All lights, brakes, and signals checked."
            },
            new()
            {
                WorkOrderId = workOrders[6].Id,
                PerformedAt = DateTime.UtcNow.AddDays(-30),
                OdometerReading = 31200,
                Notes = "Coolant flushed and refilled. Thermostat replaced."
            }
        };
        await context.MaintenanceRecords.AddRangeAsync(maintenanceRecords);

        var inspections = new List<Inspection>
        {
            new()
            {
                VehicleId = vehicles[0].Id,
                InspectorUserId = users[2].Id,
                InspectedAt = DateTime.UtcNow.AddDays(-5),
                Status = InspectionStatus.Passed,
                Notes = "All systems nominal. Tires at 35 PSI."
            },
            new()
            {
                VehicleId = vehicles[1].Id,
                InspectorUserId = users[2].Id,
                InspectedAt = DateTime.UtcNow.AddDays(-20),
                Status = InspectionStatus.Passed,
                Notes = "Good condition. Minor surface rust on undercarriage noted."
            },
            new()
            {
                VehicleId = vehicles[2].Id,
                InspectorUserId = users[2].Id,
                InspectedAt = DateTime.UtcNow.AddDays(-3),
                Status = InspectionStatus.Failed,
                Notes = "Brake fluid contaminated. Left tail light inoperative. Work order generated.",
                GeneratedWorkOrderId = workOrders[1].Id
            },
            new()
            {
                VehicleId = vehicles[2].Id,
                InspectorUserId = users[1].Id,
                InspectedAt = DateTime.UtcNow.AddDays(-45),
                Status = InspectionStatus.NeedsReview,
                Notes = "Tire tread at 3mm — borderline. Recommend replacement within 30 days."
            }
        };
        await context.Inspections.AddRangeAsync(inspections);

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

        var maintenanceSchedules = new List<MaintenanceSchedule>
        {
            new()
            {
                Name = "Oil Change",
                Description = "Change engine oil and filter every 5,000 miles.",
                VehicleId = vehicles[0].Id,
                MileageInterval = 5000,
                LastPerformedAt = DateTime.UtcNow.AddDays(-90),
                LastPerformedMileage = 10000,
                IsActive = true
            },
            new()
            {
                Name = "Annual Inspection",
                Description = "Full vehicle inspection once per year.",
                VehicleId = vehicles[1].Id,
                DayInterval = 365,
                LastPerformedAt = DateTime.UtcNow.AddDays(-400),
                IsActive = true
            }
        };
        await context.MaintenanceSchedules.AddRangeAsync(maintenanceSchedules);
        await context.SaveChangesAsync();

        var auditLogs = new List<AuditLog>
        {
            new()
            {
                Action = AuditAction.VehicleUpdated,
                EntityType = "Vehicle",
                EntityId = vehicles[0].Id,
                ChangedBy = "alice.johnson@openfleet.io",
                OldValue = "Mileage=14000",
                NewValue = "Mileage=15023",
                Notes = "Mileage updated from fuel telemetry import."
            },
            new()
            {
                Action = AuditAction.WorkOrderStatusChanged,
                EntityType = "WorkOrder",
                EntityId = workOrders[0].Id,
                ChangedBy = "bob.smith@openfleet.io",
                OldValue = "Open",
                NewValue = "Completed",
                Notes = "Oil change completed."
            }
        };
        await context.AuditLogs.AddRangeAsync(auditLogs);

        await context.SaveChangesAsync();
        logger.LogInformation("Database seeding complete.");
    }

    /// <summary>
    /// Backfills vendors/parts on existing databases and adds low-stock demo rows when useful.
    /// </summary>
    public static async Task EnsureInventorySeedDataAsync(OpenFleetDbContext context, ILogger logger)
    {
        var vendors = await context.Vendors.OrderBy(v => v.Name).ToListAsync();

        if (vendors.Count == 0)
        {
            logger.LogInformation("No vendors found — seeding default vendors and parts.");
            vendors =
            [
                new Vendor
                {
                    Id = Guid.Parse("33333333-0000-0000-0000-000000000001"),
                    Name = "AutoParts Direct", ContactName = "Mike Torres",
                    Email = "sales@autopartsdirect.com", Phone = "555-0101",
                    Address = "100 Industrial Blvd, Detroit, MI 48201"
                },
                new Vendor
                {
                    Id = Guid.Parse("33333333-0000-0000-0000-000000000002"),
                    Name = "FleetSupply Co.", ContactName = "Sarah Lee",
                    Email = "orders@fleetsupply.com", Phone = "555-0202",
                    Address = "250 Commerce Ave, Chicago, IL 60601"
                }
            ];
            await context.Vendors.AddRangeAsync(vendors);
            await context.SaveChangesAsync();
        }

        if (!await context.Parts.AnyAsync())
        {
            logger.LogInformation("No parts found — seeding default parts inventory.");
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
                },
                new()
                {
                    Name = "Spark Plugs (Set of 4)", PartNumber = "SP-4PK-IR",
                    VendorId = vendors[0].Id, QuantityOnHand = 18, UnitCost = 32.50m
                },
                new()
                {
                    Name = "Coolant (1 Gallon)", PartNumber = "CL-50-50-GAL",
                    VendorId = vendors[1].Id, QuantityOnHand = 12, UnitCost = 24.99m
                },
                new()
                {
                    Name = "Headlight Bulb H11", PartNumber = "HB-H11-LED",
                    VendorId = vendors[0].Id, QuantityOnHand = 0, UnitCost = 38.00m
                }
            };
            await context.Parts.AddRangeAsync(parts);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded {PartCount} parts across {VendorCount} vendors.", parts.Count, vendors.Count);
            return;
        }

        var hasLowStock = await context.Parts.AnyAsync(p => p.QuantityOnHand > 0 && p.QuantityOnHand <= 25);
        var hasOutOfStock = await context.Parts.AnyAsync(p => p.QuantityOnHand == 0);

        if (!hasLowStock || !hasOutOfStock)
        {
            var extras = new List<Part>();
            var changed = false;

            if (!hasLowStock)
            {
                if (!await context.Parts.AnyAsync(p => p.PartNumber == "FF-DEMO-LOW"))
                {
                    extras.Add(new Part
                    {
                        Name = "Fuel Filter", PartNumber = "FF-DEMO-LOW",
                        VendorId = vendors[0].Id, QuantityOnHand = 8, UnitCost = 19.99m
                    });
                }

                if (!await context.Parts.AnyAsync(p => p.PartNumber == "CAF-DEMO-LOW"))
                {
                    extras.Add(new Part
                    {
                        Name = "Cabin Air Filter", PartNumber = "CAF-DEMO-LOW",
                        VendorId = vendors[1].Id, QuantityOnHand = 15, UnitCost = 16.50m
                    });
                }
            }

            if (!hasOutOfStock)
            {
                var headlight = await context.Parts
                    .FirstOrDefaultAsync(p => p.PartNumber == "HB-H11-LED");

                if (headlight is null)
                {
                    extras.Add(new Part
                    {
                        Name = "Headlight Bulb H11", PartNumber = "HB-H11-LED",
                        VendorId = vendors[0].Id, QuantityOnHand = 0, UnitCost = 38.00m
                    });
                }
                else if (headlight.QuantityOnHand > 0)
                {
                    headlight.QuantityOnHand = 0;
                    changed = true;
                }
            }

            if (extras.Count > 0)
            {
                await context.Parts.AddRangeAsync(extras);
                changed = true;
            }

            if (changed)
            {
                await context.SaveChangesAsync();
                logger.LogInformation(
                    "Updated inventory demo data ({AddedCount} part(s) added).",
                    extras.Count);
            }
        }
    }
}
