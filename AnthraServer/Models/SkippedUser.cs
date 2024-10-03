// Models/SkippedUser.cs
using System;

namespace MyBackendApp.Models
{
    public class SkippedUserModel
    {
        public int Id { get; set; }

        // The user who is skipping
        public string UserId { get; set; }
        public ApplicationUser User { get; set; }

        // The user who is being skipped
        public string SkippedUserId { get; set; }
        public ApplicationUser SkippedUser { get; set; }

        public DateTime SkippedAt { get; set; }
    }
}