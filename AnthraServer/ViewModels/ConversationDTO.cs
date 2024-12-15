using MyBackendApp.Models;

namespace MyBackendApp.ViewModels
{
    public class ConversationDTO
    {
        public string UserId { get; set; } 

        public string UserName { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }

        public string UserEmail { get; set; }
        public string UserProfilePicture { get; set; }
        public string LastMessageContent { get; set; }
        public DateTime? LastMessageTimestamp { get; set; }
        public string LastMessageSenderId { get; set; } 
        
        public bool? InvitationStatus { get; set; }
        public InvitationActionType ActionType { get; set; }

    }
}