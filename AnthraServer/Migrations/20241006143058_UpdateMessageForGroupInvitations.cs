using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnthraBackend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMessageForGroupInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GroupId",
                table: "Messages",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsGroupInvitation",
                table: "Messages",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GroupId",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "IsGroupInvitation",
                table: "Messages");
        }
    }
}
