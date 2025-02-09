﻿using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnthraBackend.Migrations
{
    /// <inheritdoc />
    public partial class MakeIsProfileVisibleNonNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "IsProfileVisible",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "IsProfileVisible",
                table: "AspNetUsers",
                type: "boolean",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "boolean");
        }
    }
}
