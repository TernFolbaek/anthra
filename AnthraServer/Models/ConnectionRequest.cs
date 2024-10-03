using System;

namespace MyBackendApp.Models
{
    public enum ConnectionStatus
    {
        Pending = 0,
        Accepted = 1,
        Declined = 2
    }

    public class ConnectionRequestDTO
    {
        public int Id { get; set; }
        public string SenderId { get; set; }
        public string SenderName { get; set; }
        public string SenderEmail { get; set; }
        public string SenderProfilePicture { get; set; }
        public string ReceiverId { get; set; }
        public ConnectionStatus Status { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
    }


    public class ConnectionRequest
    {
        public int Id { get; set; }

        public string SenderId { get; set; }
        public ApplicationUser Sender { get; set; }

        public string ReceiverId { get; set; }
        public ApplicationUser Receiver { get; set; }

        public ConnectionStatus Status { get; set; }

        public DateTime RequestedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
    }
}