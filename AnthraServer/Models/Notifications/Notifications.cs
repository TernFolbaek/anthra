// Models/Notification.cs
using System;

namespace MyBackendApp.Models
{
    public class Notification
    {
        public int Id { get; set; }
        public string UserId { get; set; } // The user who receives the notification
        public string Type { get; set; } // e.g., "ConnectionRequest", "Message", "GroupMessage"
        public string Content { get; set; }
        public DateTime Timestamp { get; set; }
        public bool IsRead { get; set; }
        public string SenderId { get; set; } // The user who triggered the notification
        public string SenderName { get; set; }
        public int? GroupId { get; set; } // Added GroupId
    }
}