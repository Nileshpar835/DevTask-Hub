using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DevTaskHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectGitHubAndPullRequestAuthor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AuthorAvatarUrl",
                table: "TaskPullRequests",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AuthorGitHubUsername",
                table: "TaskPullRequests",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LinkedByUserId",
                table: "TaskPullRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GitHubRepoUrl",
                table: "Projects",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskPullRequests_LinkedByUserId",
                table: "TaskPullRequests",
                column: "LinkedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskPullRequests_Users_LinkedByUserId",
                table: "TaskPullRequests",
                column: "LinkedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskPullRequests_Users_LinkedByUserId",
                table: "TaskPullRequests");

            migrationBuilder.DropIndex(
                name: "IX_TaskPullRequests_LinkedByUserId",
                table: "TaskPullRequests");

            migrationBuilder.DropColumn(
                name: "AuthorAvatarUrl",
                table: "TaskPullRequests");

            migrationBuilder.DropColumn(
                name: "AuthorGitHubUsername",
                table: "TaskPullRequests");

            migrationBuilder.DropColumn(
                name: "LinkedByUserId",
                table: "TaskPullRequests");

            migrationBuilder.DropColumn(
                name: "GitHubRepoUrl",
                table: "Projects");
        }
    }
}
