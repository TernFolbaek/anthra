using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnthraBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddConnectionNoteToConnections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConnectionNote",
                table: "ConnectionRequests",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupExploreSessions_UserId",
                table: "GroupExploreSessions",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_GroupExploreSessions_UserId",
                table: "GroupExploreSessions");

            migrationBuilder.DropColumn(
                name: "ConnectionNote",
                table: "ConnectionRequests");
        }
    }
}
