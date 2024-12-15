using System.ComponentModel.DataAnnotations;

namespace MyBackendApp.Models
{
    public class UpdateMessageRequest
    {
        [Required]
        public int MessageId { get; set; }

        [Required]
        public InvitationActionType ActionType { get; set; }
    }
}