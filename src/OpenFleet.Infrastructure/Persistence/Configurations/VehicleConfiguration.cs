using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenFleet.Domain.Entities;

namespace OpenFleet.Infrastructure.Persistence.Configurations;

public class VehicleConfiguration : IEntityTypeConfiguration<Vehicle>
{
    public void Configure(EntityTypeBuilder<Vehicle> builder)
    {
        builder.HasKey(v => v.Id);
        builder.Property(v => v.VIN).IsRequired().HasMaxLength(17);
        builder.HasIndex(v => v.VIN).IsUnique();
        builder.Property(v => v.LicensePlate).IsRequired().HasMaxLength(20);
        builder.HasIndex(v => v.LicensePlate).IsUnique();
        builder.Property(v => v.Make).IsRequired().HasMaxLength(100);
        builder.Property(v => v.Model).IsRequired().HasMaxLength(100);
        builder.Property(v => v.Year).IsRequired();
        builder.Property(v => v.Mileage).IsRequired();
        builder.Property(v => v.Status).IsRequired();

        builder.HasOne(v => v.Department)
            .WithMany(d => d.Vehicles)
            .HasForeignKey(v => v.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
