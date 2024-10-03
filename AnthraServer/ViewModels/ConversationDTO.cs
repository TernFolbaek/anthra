namespace MyBackendApp.ViewModels
{
    public class ConversationDTO
    {
        public string UserId { get; set; } // ID of the other user
        public string UserName { get; set; }
        public string UserEmail { get; set; }
        public string UserProfilePicture { get; set; }
        public string LastMessageContent { get; set; }
        public DateTime? LastMessageTimestamp { get; set; }
    }
}