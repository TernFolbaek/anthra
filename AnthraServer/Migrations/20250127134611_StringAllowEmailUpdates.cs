using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnthraBackend.Migrations
{
    /// <inheritdoc />
    public partial class StringAllowEmailUpdates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Optional: Update existing data to ensure it can be cast to boolean
            // Adjust the CASE statements based on your actual data
            migrationBuilder.Sql(@"
                UPDATE ""AspNetUsers""
                SET ""AllowEmailUpdates"" = CASE 
                    WHEN LOWER(""AllowEmailUpdates"") IN ('true', 't', '1', 'yes') THEN 'true'
                    WHEN LOWER(""AllowEmailUpdates"") IN ('false', 'f', '0', 'no') THEN 'false'
                    ELSE 'false' -- Default value if none match
                END;
            ");

            // Alter the column type to boolean using the USING clause
            migrationBuilder.Sql(@"
                ALTER TABLE ""AspNetUsers""
                ALTER COLUMN ""AllowEmailUpdates"" TYPE boolean
                USING (""AllowEmailUpdates""::boolean);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert the column type back to text
            migrationBuilder.Sql(@"
                ALTER TABLE ""AspNetUsers""
                ALTER COLUMN ""AllowEmailUpdates"" TYPE text
                USING (
                    CASE 
                        WHEN ""AllowEmailUpdates"" THEN 'true'
                        ELSE 'false'
                    END
                );
            ");
        }
    }
}