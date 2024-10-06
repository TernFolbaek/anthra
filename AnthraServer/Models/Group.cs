// Models/Group.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MyBackendApp.Models
{
    public class Group
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }
        
        public string CreatorId { get; set; }
        public ApplicationUser Creator { get; set; }

        public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    }
}