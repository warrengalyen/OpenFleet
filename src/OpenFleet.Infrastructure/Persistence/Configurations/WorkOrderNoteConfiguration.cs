using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenFleet.Domain.Entities;

namespace OpenFleet.Infrastructure.Persistence.Configurations;

public class WorkOrderNoteConfiguration : IEntityTypeConfiguration<WorkOrderNote>
{
    public void Configure(EntityTypeBuilder<WorkOrderNote> builder)
    {
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Content).IsRequired().HasMaxLength(2000);
        builder.Property(n => n.AuthorName).IsRequired().HasMaxLength(100);

        builder.HasOne(n => n.WorkOrder)
            .WithMany(w => w.Notes)
            .HasForeignKey(n => n.WorkOrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
