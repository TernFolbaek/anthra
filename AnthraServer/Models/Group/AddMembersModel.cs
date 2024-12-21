using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MyBackendApp.ViewModels
{
    public class AddMembersModel
    {
        public string GroupName { get; set; }

        public string GroupPurpose { get; set; }
        public int GroupId { get; set; }


        [Required]
        public List<string> InvitedUserIds { get; set; } = new List<string>();
    }
}