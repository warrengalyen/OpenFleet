using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenFleet.Domain.Entities;

namespace OpenFleet.Infrastructure.Persistence.Configurations;

public class MaintenanceRecordConfiguration : IEntityTypeConfiguration<MaintenanceRecord>
{
    public void Configure(EntityTypeBuilder<MaintenanceRecord> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Notes).HasMaxLength(2000);
        builder.Property(m => m.OdometerReading).IsRequired();
        builder.Property(m => m.PerformedAt).IsRequired();

        builder.HasOne(m => m.WorkOrder)
            .WithOne(w => w.MaintenanceRecord)
            .HasForeignKey<MaintenanceRecord>(m => m.WorkOrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
