using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenFleet.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddApplicationSettingsAndWorkOrderDueDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DueDate",
                table: "WorkOrders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ApplicationSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DefaultWorkOrderPriority = table.Column<int>(type: "integer", nullable: false),
                    DefaultWorkOrderDueDays = table.Column<int>(type: "integer", nullable: false),
                    AutoCreateWorkOrderOnFailedInspection = table.Column<bool>(type: "boolean", nullable: false),
                    MaintenanceReminderLeadDays = table.Column<int>(type: "integer", nullable: false),
                    LowPartsStockThreshold = table.Column<int>(type: "integer", nullable: false),
                    IntegrationRetryLimit = table.Column<int>(type: "integer", nullable: false),
                    AuditLogRetentionDays = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApplicationSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApplicationSettings");

            migrationBuilder.DropColumn(
                name: "DueDate",
                table: "WorkOrders");
        }
    }
}
