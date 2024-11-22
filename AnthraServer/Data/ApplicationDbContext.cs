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
        public DbSet<Group> Groups { get; set; }
        public DbSet<GroupMember> GroupMembers { get; set; }
        public DbSet<SkippedGroup> SkippedGroups { get; set; }
        public DbSet<Connection> Connections { get; set; }
        public DbSet<GroupMessage> GroupMessages { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
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
           
            builder.Entity<ApplicationUser>(b =>
            {
                b.OwnsMany(u => u.Courses);
            });
            
            builder.Entity<Group>()
                .HasMany(g => g.Members)
                .WithOne(gm => gm.Group)
                .HasForeignKey(gm => gm.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<GroupMember>()
                .HasOne(gm => gm.User)
                .WithMany()
                .HasForeignKey(gm => gm.UserId)
                .OnDelete(DeleteBehavior.Restrict);
       
            builder.Entity<Connection>()
                .HasOne(c => c.User1)
                .WithMany()
                .HasForeignKey(c => c.UserId1)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Connection>()
                .HasOne(c => c.User2)
                .WithMany()
                .HasForeignKey(c => c.UserId2)
                .OnDelete(DeleteBehavior.Cascade);
            
            builder.Entity<GroupMessage>()
                .HasOne(gm => gm.Group)
                .WithMany(g => g.Messages)
                .HasForeignKey(gm => gm.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<GroupMessage>()
                .HasOne(gm => gm.Sender)
                .WithMany()
                .HasForeignKey(gm => gm.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            // Ensure the Group model has a Messages collection
            builder.Entity<Group>()
                .HasMany(g => g.Messages)
                .WithOne(gm => gm.Group)
                .HasForeignKey(gm => gm.GroupId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}