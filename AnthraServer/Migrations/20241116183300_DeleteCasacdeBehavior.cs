using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnthraBackend.Migrations
{
    /// <inheritdoc />
    public partial class DeleteCasacdeBehavior : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GroupMembers_AspNetUsers_UserId",
                table: "GroupMembers");

            migrationBuilder.DropForeignKey(
                name: "FK_GroupMessages_AspNetUsers_SenderId",
                table: "GroupMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_SkippedUsers_AspNetUsers_SkippedUserId",
                table: "SkippedUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_SkippedUsers_AspNetUsers_UserId",
                table: "SkippedUsers");

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMembers_AspNetUsers_UserId",
                table: "GroupMembers",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMessages_AspNetUsers_SenderId",
                table: "GroupMessages",
                column: "SenderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SkippedUsers_AspNetUsers_SkippedUserId",
                table: "SkippedUsers",
                column: "SkippedUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SkippedUsers_AspNetUsers_UserId",
                table: "SkippedUsers",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GroupMembers_AspNetUsers_UserId",
                table: "GroupMembers");

            migrationBuilder.DropForeignKey(
                name: "FK_GroupMessages_AspNetUsers_SenderId",
                table: "GroupMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_SkippedUsers_AspNetUsers_SkippedUserId",
                table: "SkippedUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_SkippedUsers_AspNetUsers_UserId",
                table: "SkippedUsers");

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMembers_AspNetUsers_UserId",
                table: "GroupMembers",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMessages_AspNetUsers_SenderId",
                table: "GroupMessages",
                column: "SenderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SkippedUsers_AspNetUsers_SkippedUserId",
                table: "SkippedUsers",
                column: "SkippedUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SkippedUsers_AspNetUsers_UserId",
                table: "SkippedUsers",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
