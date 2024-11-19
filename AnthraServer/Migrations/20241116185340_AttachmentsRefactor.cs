using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnthraBackend.Migrations
{
    /// <inheritdoc />
    public partial class AttachmentsRefactor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_GroupMessages_GroupMessageId1",
                table: "Attachments");

            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_Messages_MessageId1",
                table: "Attachments");

            migrationBuilder.DropIndex(
                name: "IX_Attachments_GroupMessageId1",
                table: "Attachments");

            migrationBuilder.DropIndex(
                name: "IX_Attachments_MessageId1",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "GroupMessageId1",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "MessageId1",
                table: "Attachments");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GroupMessageId1",
                table: "Attachments",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MessageId1",
                table: "Attachments",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_GroupMessageId1",
                table: "Attachments",
                column: "GroupMessageId1",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_MessageId1",
                table: "Attachments",
                column: "MessageId1",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_GroupMessages_GroupMessageId1",
                table: "Attachments",
                column: "GroupMessageId1",
                principalTable: "GroupMessages",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_Messages_MessageId1",
                table: "Attachments",
                column: "MessageId1",
                principalTable: "Messages",
                principalColumn: "Id");
        }
    }
}
