using System;

namespace MyBackendApp.Models
{
    public enum ConnectionStatus
    {
        Pending,
        Accepted,
        Declined
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