using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenFleet.Domain.Entities;

namespace OpenFleet.Infrastructure.Persistence.Configurations;

public class IntegrationLogConfiguration : IEntityTypeConfiguration<IntegrationLog>
{
    public void Configure(EntityTypeBuilder<IntegrationLog> builder)
    {
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Source).IsRequired().HasConversion<string>();
        builder.Property(l => l.Direction).IsRequired().HasConversion<string>();
        builder.Property(l => l.Status).IsRequired().HasConversion<string>();
        builder.Property(l => l.Payload).HasMaxLength(50_000);
        builder.Property(l => l.ErrorMessage).HasMaxLength(4_000);

        builder.HasIndex(l => l.Source);
        builder.HasIndex(l => l.Status);
        builder.HasIndex(l => l.CreatedAt);
    }
}
