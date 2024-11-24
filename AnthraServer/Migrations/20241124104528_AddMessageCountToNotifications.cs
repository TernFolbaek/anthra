using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnthraBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddMessageCountToNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MessageCount",
                table: "Notifications",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MessageCount",
                table: "Notifications");
        }
    }
}
