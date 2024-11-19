using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnthraBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddIsPublicPropertyToGroup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "isPublic",
                table: "Groups",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "isPublic",
                table: "Groups");
        }
    }
}
