using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenFleet.Domain.Entities;

namespace OpenFleet.Infrastructure.Persistence.Configurations;

public class InspectionConfiguration : IEntityTypeConfiguration<Inspection>
{
    public void Configure(EntityTypeBuilder<Inspection> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Notes).HasMaxLength(2000);
        builder.Property(i => i.InspectedAt).IsRequired();

        builder.HasOne(i => i.Vehicle)
            .WithMany(v => v.Inspections)
            .HasForeignKey(i => i.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.InspectorUser)
            .WithMany(u => u.Inspections)
            .HasForeignKey(i => i.InspectorUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
