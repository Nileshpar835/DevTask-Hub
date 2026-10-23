using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DevTaskHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class _5_DeleteSeedAdminRow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAtUtc", "Email", "FullName", "IsActive", "PasswordHash", "Role", "UpdatedAtUtc" },
                values: new object[] { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@devtaskhub.com", "Initial Admin", true, "Nilesh", "Admin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) });
        }
    }
}
