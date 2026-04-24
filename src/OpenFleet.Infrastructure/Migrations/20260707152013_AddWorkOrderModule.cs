using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenFleet.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkOrderModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "VehicleId",
                table: "WorkOrders",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "AssetId",
                table: "WorkOrders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "WorkOrders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LaborHours",
                table: "WorkOrders",
                type: "numeric(8,2)",
                precision: 8,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "WorkOrderNotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkOrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    AuthorName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkOrderNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkOrderNotes_WorkOrders_WorkOrderId",
                        column: x => x.WorkOrderId,
                        principalTable: "WorkOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrders_AssetId",
                table: "WorkOrders",
                column: "AssetId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderNotes_WorkOrderId",
                table: "WorkOrderNotes",
                column: "WorkOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkOrders_Assets_AssetId",
                table: "WorkOrders",
                column: "AssetId",
                principalTable: "Assets",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkOrders_Assets_AssetId",
                table: "WorkOrders");

            migrationBuilder.DropTable(
                name: "WorkOrderNotes");

            migrationBuilder.DropIndex(
                name: "IX_WorkOrders_AssetId",
                table: "WorkOrders");

            migrationBuilder.DropColumn(
                name: "AssetId",
                table: "WorkOrders");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "WorkOrders");

            migrationBuilder.DropColumn(
                name: "LaborHours",
                table: "WorkOrders");

            migrationBuilder.AlterColumn<Guid>(
                name: "VehicleId",
                table: "WorkOrders",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
