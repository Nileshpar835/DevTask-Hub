using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DevTaskHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeRolesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Create Roles table
            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            // 2. Insert initial Roles data (Admin = 1, Developer = 2)
            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "CreatedAtUtc", "Description", "Name" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Administrator with full system access", "Admin" },
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Software Developer with project and task access", "Developer" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Name",
                table: "Roles",
                column: "Name",
                unique: true);

            // 3. Add RoleId column to Users (default to 2: Developer)
            migrationBuilder.AddColumn<int>(
                name: "RoleId",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 2);

            // 4. Migrate existing string Role data to RoleId
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Role')
                BEGIN
                    UPDATE [Users] SET [RoleId] = 1 WHERE [Role] = 'Admin';
                    UPDATE [Users] SET [RoleId] = 2 WHERE [Role] = 'Developer' OR [Role] IS NULL;
                END
            ");

            // 5. Drop old Role column from Users
            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");

            // 6. Add Foreign Key and Index
            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleId",
                table: "Users",
                column: "RoleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Roles_RoleId",
                table: "Users",
                column: "RoleId",
                principalTable: "Roles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Roles_RoleId",
                table: "Users");

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Users",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Developer");

            migrationBuilder.Sql(@"
                UPDATE [Users] SET [Role] = 'Admin' WHERE [RoleId] = 1;
                UPDATE [Users] SET [Role] = 'Developer' WHERE [RoleId] = 2;
            ");

            migrationBuilder.DropIndex(
                name: "IX_Users_RoleId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RoleId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "Roles");
        }
    }
}
