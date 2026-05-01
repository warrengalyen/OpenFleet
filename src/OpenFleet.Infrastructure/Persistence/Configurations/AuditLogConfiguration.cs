using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenFleet.Domain.Entities;

namespace OpenFleet.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Action).IsRequired().HasConversion<string>();
        builder.Property(l => l.EntityType).IsRequired().HasMaxLength(100);
        builder.Property(l => l.ChangedBy).HasMaxLength(200);
        builder.Property(l => l.OldValue).HasMaxLength(10_000);
        builder.Property(l => l.NewValue).HasMaxLength(10_000);
        builder.Property(l => l.Notes).HasMaxLength(2_000);

        builder.HasIndex(l => l.Action);
        builder.HasIndex(l => l.EntityId);
        builder.HasIndex(l => l.CreatedAt);
    }
}
