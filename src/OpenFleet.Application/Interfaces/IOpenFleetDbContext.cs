using Microsoft.EntityFrameworkCore;
using OpenFleet.Domain.Entities;

namespace OpenFleet.Application.Interfaces;

public interface IOpenFleetDbContext
{
    DbSet<Vehicle> Vehicles { get; }
    DbSet<Asset> Assets { get; }
    DbSet<WorkOrder> WorkOrders { get; }
    DbSet<WorkOrderNote> WorkOrderNotes { get; }
    DbSet<MaintenanceRecord> MaintenanceRecords { get; }
    DbSet<Inspection> Inspections { get; }
    DbSet<MaintenanceSchedule> MaintenanceSchedules { get; }
    DbSet<Part> Parts { get; }
    DbSet<Vendor> Vendors { get; }
    DbSet<Department> Departments { get; }
    DbSet<User> Users { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
