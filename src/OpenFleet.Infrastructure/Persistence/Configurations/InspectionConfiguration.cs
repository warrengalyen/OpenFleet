using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenFleet.Domain.Entities;
using OpenFleet.Domain.Enums;

namespace OpenFleet.Infrastructure.Persistence.Configurations;

public class InspectionConfiguration : IEntityTypeConfiguration<Inspection>
{
    public void Configure(EntityTypeBuilder<Inspection> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Notes).HasMaxLength(2000);
        builder.Property(i => i.InspectedAt).IsRequired();
        builder.Property(i => i.Status).IsRequired().HasConversion<string>();

        builder.HasOne(i => i.Vehicle)
            .WithMany(v => v.Inspections)
            .HasForeignKey(i => i.VehicleId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(i => i.Asset)
            .WithMany()
            .HasForeignKey(i => i.AssetId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(i => i.InspectorUser)
            .WithMany(u => u.Inspections)
            .HasForeignKey(i => i.InspectorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.GeneratedWorkOrder)
            .WithMany()
            .HasForeignKey(i => i.GeneratedWorkOrderId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
