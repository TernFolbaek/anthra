using System.ComponentModel.DataAnnotations;

namespace MyBackendApp.Models
{
    public class UpdateGroupModel
    {
        public int GroupId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }

        public string GroupMemberDesire { get; set; }
        public bool isPublic { get; set; }

    }
}