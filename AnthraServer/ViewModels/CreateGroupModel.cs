// ViewModels/CreateGroupModel.cs
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MyBackendApp.ViewModels
{
    public class CreateGroupModel
    {
        [Required]
        public string Name { get; set; }
        
        public string AdminName { get; set; }
        public string GroupDescription { get; set; }
        public string GroupMemberDesire { get; set; }
        
        public string GroupPurpose { get; set; }

        
        public bool isPublic { get; set; }
        [Required]
        public List<string> InvitedUserIds { get; set; } = new List<string>();
    }
}