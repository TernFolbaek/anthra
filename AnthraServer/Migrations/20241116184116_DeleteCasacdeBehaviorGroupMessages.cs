using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnthraBackend.Migrations
{
    /// <inheritdoc />
    public partial class DeleteCasacdeBehaviorGroupMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_GroupMessages_GroupMessageId",
                table: "Attachments");

            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_Messages_MessageId",
                table: "Attachments");

            migrationBuilder.DropForeignKey(
                name: "FK_GroupMessages_AspNetUsers_SenderId",
                table: "GroupMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_GroupMessages_Groups_GroupId",
                table: "GroupMessages");

            migrationBuilder.DropIndex(
                name: "IX_Attachments_GroupMessageId",
                table: "Attachments");

            migrationBuilder.DropIndex(
                name: "IX_Attachments_MessageId",
                table: "Attachments");

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
                name: "IX_Attachments_GroupMessageId",
                table: "Attachments",
                column: "GroupMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_GroupMessageId1",
                table: "Attachments",
                column: "GroupMessageId1",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_MessageId",
                table: "Attachments",
                column: "MessageId");

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_MessageId1",
                table: "Attachments",
                column: "MessageId1",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_GroupMessages_GroupMessageId",
                table: "Attachments",
                column: "GroupMessageId",
                principalTable: "GroupMessages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_GroupMessages_GroupMessageId1",
                table: "Attachments",
                column: "GroupMessageId1",
                principalTable: "GroupMessages",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_Messages_MessageId",
                table: "Attachments",
                column: "MessageId",
                principalTable: "Messages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_Messages_MessageId1",
                table: "Attachments",
                column: "MessageId1",
                principalTable: "Messages",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMessages_AspNetUsers_SenderId",
                table: "GroupMessages",
                column: "SenderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMessages_Groups_GroupId",
                table: "GroupMessages",
                column: "GroupId",
                principalTable: "Groups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_GroupMessages_GroupMessageId",
                table: "Attachments");

            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_GroupMessages_GroupMessageId1",
                table: "Attachments");

            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_Messages_MessageId",
                table: "Attachments");

            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_Messages_MessageId1",
                table: "Attachments");

            migrationBuilder.DropForeignKey(
                name: "FK_GroupMessages_AspNetUsers_SenderId",
                table: "GroupMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_GroupMessages_Groups_GroupId",
                table: "GroupMessages");

            migrationBuilder.DropIndex(
                name: "IX_Attachments_GroupMessageId",
                table: "Attachments");

            migrationBuilder.DropIndex(
                name: "IX_Attachments_GroupMessageId1",
                table: "Attachments");

            migrationBuilder.DropIndex(
                name: "IX_Attachments_MessageId",
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

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_GroupMessageId",
                table: "Attachments",
                column: "GroupMessageId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_MessageId",
                table: "Attachments",
                column: "MessageId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_GroupMessages_GroupMessageId",
                table: "Attachments",
                column: "GroupMessageId",
                principalTable: "GroupMessages",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_Messages_MessageId",
                table: "Attachments",
                column: "MessageId",
                principalTable: "Messages",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMessages_AspNetUsers_SenderId",
                table: "GroupMessages",
                column: "SenderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMessages_Groups_GroupId",
                table: "GroupMessages",
                column: "GroupId",
                principalTable: "Groups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
