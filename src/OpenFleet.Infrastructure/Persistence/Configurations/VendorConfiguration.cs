using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenFleet.Domain.Entities;

namespace OpenFleet.Infrastructure.Persistence.Configurations;

public class VendorConfiguration : IEntityTypeConfiguration<Vendor>
{
    public void Configure(EntityTypeBuilder<Vendor> builder)
    {
        builder.HasKey(v => v.Id);
        builder.Property(v => v.Name).IsRequired().HasMaxLength(200);
        builder.Property(v => v.ContactName).HasMaxLength(100);
        builder.Property(v => v.Email).HasMaxLength(200);
        builder.Property(v => v.Phone).HasMaxLength(30);
        builder.Property(v => v.Address).HasMaxLength(500);
    }
}
