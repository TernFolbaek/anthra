// Models/GroupMember.cs
using System.ComponentModel.DataAnnotations;

namespace MyBackendApp.Models
{
    public class GroupMember
    {
        public int Id { get; set; }

        [Required]
        public int GroupId { get; set; }
        public Group Group { get; set; }

        [Required]
        public string UserId { get; set; }
        public ApplicationUser User { get; set; }

        public bool IsAccepted { get; set; } = false;
    }
}