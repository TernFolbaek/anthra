using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnthraBackend.Migrations
{
    /// <inheritdoc />
    public partial class revertBackWithoutGroupDynamicMessage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GroupName",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "InvitationAccepted",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "InviteeName",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "InviterName",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Groups");

            migrationBuilder.RenameColumn(
                name: "AdminName",
                table: "Groups",
                newName: "adminName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "adminName",
                table: "Groups",
                newName: "AdminName");

            migrationBuilder.AddColumn<string>(
                name: "GroupName",
                table: "Messages",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "InvitationAccepted",
                table: "Messages",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "InviteeName",
                table: "Messages",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "InviterName",
                table: "Messages",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Groups",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
