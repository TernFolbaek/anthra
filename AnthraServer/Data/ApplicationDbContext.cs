// Data/ApplicationDbContext.cs
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MyBackendApp.Models;

namespace MyBackendApp.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public DbSet<ConnectionRequest> ConnectionRequests { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<SkippedUserModel> SkippedUsers { get; set; }


        // Constructor
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Optional: Override OnModelCreating if necessary
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure relationships if necessary
            builder.Entity<SkippedUserModel>()
                .HasOne(su => su.User)
                .WithMany()
                .HasForeignKey(su => su.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<SkippedUserModel>()
                .HasOne(su => su.SkippedUser)
                .WithMany()
                .HasForeignKey(su => su.SkippedUserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}