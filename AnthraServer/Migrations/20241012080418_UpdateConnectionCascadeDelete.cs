using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnthraBackend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateConnectionCascadeDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Connections_AspNetUsers_User1Id",
                table: "Connections");

            migrationBuilder.DropForeignKey(
                name: "FK_Connections_AspNetUsers_User2Id",
                table: "Connections");

            migrationBuilder.DropIndex(
                name: "IX_Connections_User1Id",
                table: "Connections");

            migrationBuilder.DropIndex(
                name: "IX_Connections_User2Id",
                table: "Connections");

            migrationBuilder.DropColumn(
                name: "User1Id",
                table: "Connections");

            migrationBuilder.DropColumn(
                name: "User2Id",
                table: "Connections");

            migrationBuilder.AddColumn<string>(
                name: "adminName",
                table: "Groups",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Connections_UserId1",
                table: "Connections",
                column: "UserId1");

            migrationBuilder.CreateIndex(
                name: "IX_Connections_UserId2",
                table: "Connections",
                column: "UserId2");

            migrationBuilder.AddForeignKey(
                name: "FK_Connections_AspNetUsers_UserId1",
                table: "Connections",
                column: "UserId1",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Connections_AspNetUsers_UserId2",
                table: "Connections",
                column: "UserId2",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Connections_AspNetUsers_UserId1",
                table: "Connections");

            migrationBuilder.DropForeignKey(
                name: "FK_Connections_AspNetUsers_UserId2",
                table: "Connections");

            migrationBuilder.DropIndex(
                name: "IX_Connections_UserId1",
                table: "Connections");

            migrationBuilder.DropIndex(
                name: "IX_Connections_UserId2",
                table: "Connections");

            migrationBuilder.DropColumn(
                name: "adminName",
                table: "Groups");

            migrationBuilder.AddColumn<string>(
                name: "User1Id",
                table: "Connections",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "User2Id",
                table: "Connections",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Connections_User1Id",
                table: "Connections",
                column: "User1Id");

            migrationBuilder.CreateIndex(
                name: "IX_Connections_User2Id",
                table: "Connections",
                column: "User2Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Connections_AspNetUsers_User1Id",
                table: "Connections",
                column: "User1Id",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Connections_AspNetUsers_User2Id",
                table: "Connections",
                column: "User2Id",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }
    }
}
