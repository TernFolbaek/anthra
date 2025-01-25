using Microsoft.EntityFrameworkCore;

namespace MyBackendApp.Models
{
    [Index(nameof(UserId), IsUnique = true)]
    public class GroupExploreSession
    {
        public int Id { get; set; }
        public string UserId { get; set; }        // The explorer
        public DateTime LastFetched { get; set; }

        public ICollection<GroupExploreSessionGroup> FetchedGroups { get; set; }
    }

    public class GroupExploreSessionGroup
    {
        public int Id { get; set; }

        public int GroupExploreSessionId { get; set; }
        public GroupExploreSession Session { get; set; }

        public int GroupId { get; set; }

        // Mark false when the user "skips" or "applies" or otherwise removes this group
        public bool IsActive { get; set; } = true;
    }

}