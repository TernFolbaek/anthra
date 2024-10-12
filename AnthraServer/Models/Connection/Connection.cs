// Models/Connection.cs
using System;

namespace MyBackendApp.Models
{
    public class Connection
    {
        public int Id { get; set; }

        public string UserId1 { get; set; }
        public ApplicationUser User1 { get; set; }

        public string UserId2 { get; set; }
        public ApplicationUser User2 { get; set; }

        public DateTime ConnectedAt { get; set; }
    }
}