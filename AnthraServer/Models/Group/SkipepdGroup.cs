
using System;

namespace MyBackendApp.Models
{
    public class SkippedGroup
    {
        public int Id { get; set; }

        // The user who is skipping the group
        public string UserId { get; set; }
        public ApplicationUser User { get; set; }

        // The group that is being skipped
        public int GroupId { get; set; }
        public Group Group { get; set; }

        public DateTime SkippedAt { get; set; }
    }
}