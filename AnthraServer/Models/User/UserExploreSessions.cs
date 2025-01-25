using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyBackendApp.Models
{
    [Index(nameof(UserId), IsUnique = true)]
    public class UserExploreSession
    {
        public int Id { get; set; }

        public string UserId { get; set; }
        public DateTime LastFetched { get; set; }

        public ICollection<UserExploreSessionUser> FetchedUsers { get; set; }
    }
}