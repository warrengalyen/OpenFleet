using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenFleet.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInspectionsAndMaintenanceSchedules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Inspections_Vehicles_VehicleId",
                table: "Inspections");

            migrationBuilder.DropColumn(
                name: "Passed",
                table: "Inspections");

            migrationBuilder.AlterColumn<Guid>(
                name: "VehicleId",
                table: "Inspections",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "AssetId",
                table: "Inspections",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "GeneratedWorkOrderId",
                table: "Inspections",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Inspections",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "MaintenanceSchedules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    VehicleId = table.Column<Guid>(type: "uuid", nullable: true),
                    AssetId = table.Column<Guid>(type: "uuid", nullable: true),
                    MileageInterval = table.Column<int>(type: "integer", nullable: true),
                    DayInterval = table.Column<int>(type: "integer", nullable: true),
                    LastPerformedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastPerformedMileage = table.Column<int>(type: "integer", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceSchedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaintenanceSchedules_Assets_AssetId",
                        column: x => x.AssetId,
                        principalTable: "Assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MaintenanceSchedules_Vehicles_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Inspections_AssetId",
                table: "Inspections",
                column: "AssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Inspections_GeneratedWorkOrderId",
                table: "Inspections",
                column: "GeneratedWorkOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceSchedules_AssetId",
                table: "MaintenanceSchedules",
                column: "AssetId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceSchedules_VehicleId",
                table: "MaintenanceSchedules",
                column: "VehicleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Inspections_Assets_AssetId",
                table: "Inspections",
                column: "AssetId",
                principalTable: "Assets",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Inspections_Vehicles_VehicleId",
                table: "Inspections",
                column: "VehicleId",
                principalTable: "Vehicles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Inspections_WorkOrders_GeneratedWorkOrderId",
                table: "Inspections",
                column: "GeneratedWorkOrderId",
                principalTable: "WorkOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Inspections_Assets_AssetId",
                table: "Inspections");

            migrationBuilder.DropForeignKey(
                name: "FK_Inspections_Vehicles_VehicleId",
                table: "Inspections");

            migrationBuilder.DropForeignKey(
                name: "FK_Inspections_WorkOrders_GeneratedWorkOrderId",
                table: "Inspections");

            migrationBuilder.DropTable(
                name: "MaintenanceSchedules");

            migrationBuilder.DropIndex(
                name: "IX_Inspections_AssetId",
                table: "Inspections");

            migrationBuilder.DropIndex(
                name: "IX_Inspections_GeneratedWorkOrderId",
                table: "Inspections");

            migrationBuilder.DropColumn(
                name: "AssetId",
                table: "Inspections");

            migrationBuilder.DropColumn(
                name: "GeneratedWorkOrderId",
                table: "Inspections");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Inspections");

            migrationBuilder.AlterColumn<Guid>(
                name: "VehicleId",
                table: "Inspections",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Passed",
                table: "Inspections",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddForeignKey(
                name: "FK_Inspections_Vehicles_VehicleId",
                table: "Inspections",
                column: "VehicleId",
                principalTable: "Vehicles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
