using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenFleet.Domain.Entities;

namespace OpenFleet.Infrastructure.Persistence.Configurations;

public class AssetConfiguration : IEntityTypeConfiguration<Asset>
{
    public void Configure(EntityTypeBuilder<Asset> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Name).IsRequired().HasMaxLength(200);
        builder.Property(a => a.AssetTag).IsRequired().HasMaxLength(50);
        builder.HasIndex(a => a.AssetTag).IsUnique();
        builder.Property(a => a.Type).IsRequired().HasMaxLength(100);
        builder.Property(a => a.Condition).IsRequired();
        builder.Property(a => a.Status).IsRequired();

        builder.HasOne(a => a.Department)
            .WithMany()
            .HasForeignKey(a => a.DepartmentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(a => a.Vehicle)
            .WithMany(v => v.Assets)
            .HasForeignKey(a => a.VehicleId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
