using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenFleet.Domain.Entities;

namespace OpenFleet.Infrastructure.Persistence.Configurations;

public class WorkOrderConfiguration : IEntityTypeConfiguration<WorkOrder>
{
    public void Configure(EntityTypeBuilder<WorkOrder> builder)
    {
        builder.HasKey(w => w.Id);
        builder.Property(w => w.Title).IsRequired().HasMaxLength(300);
        builder.Property(w => w.Description).HasMaxLength(2000);
        builder.Property(w => w.Status).IsRequired();
        builder.Property(w => w.Priority).IsRequired();
        builder.Property(w => w.LaborHours).HasPrecision(8, 2);
        builder.Property(w => w.CompletedAt);

        builder.HasOne(w => w.Vehicle)
            .WithMany(v => v.WorkOrders)
            .HasForeignKey(w => w.VehicleId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasOne(w => w.Asset)
            .WithMany()
            .HasForeignKey(w => w.AssetId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasOne(w => w.AssignedUser)
            .WithMany(u => u.AssignedWorkOrders)
            .HasForeignKey(w => w.AssignedUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
