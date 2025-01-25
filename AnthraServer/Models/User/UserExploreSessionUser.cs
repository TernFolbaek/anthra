namespace MyBackendApp.Models
{
    public class UserExploreSessionUser
    {
        public int Id { get; set; }

        public int UserExploreSessionId { get; set; }
        public UserExploreSession Session { get; set; }

        public string FetchedUserId { get; set; }

        // Set to false when user is "removed" from the session (skip/connect)
        public bool IsActive { get; set; } = true;
    }
}
