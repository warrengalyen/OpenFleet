using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenFleet.Domain.Entities;

namespace OpenFleet.Infrastructure.Persistence.Configurations;

public class ApplicationSettingsConfiguration : IEntityTypeConfiguration<ApplicationSettings>
{
    public void Configure(EntityTypeBuilder<ApplicationSettings> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.OrganizationName).IsRequired().HasMaxLength(200);
        builder.Property(s => s.DefaultWorkOrderPriority).IsRequired();
        builder.Property(s => s.DefaultWorkOrderDueDays).IsRequired();
        builder.Property(s => s.AutoCreateWorkOrderOnFailedInspection).IsRequired();
        builder.Property(s => s.MaintenanceReminderLeadDays).IsRequired();
        builder.Property(s => s.LowPartsStockThreshold).IsRequired();
        builder.Property(s => s.IntegrationRetryLimit).IsRequired();
        builder.Property(s => s.AuditLogRetentionDays).IsRequired();
    }
}
