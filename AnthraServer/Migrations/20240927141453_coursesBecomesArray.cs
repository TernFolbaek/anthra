using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnthraBackend.Migrations
{
    /// <inheritdoc />
    public partial class coursesBecomesArray : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Course",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<List<string>>(
                name: "Courses",
                table: "AspNetUsers",
                type: "text[]",
                nullable: true);
        }
        

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Courses",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<string>(
                name: "Course",
                table: "AspNetUsers",
                type: "text",
                nullable: true);
        }
    }
}
