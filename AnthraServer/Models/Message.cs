using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyBackendApp.Models
{
    public class Message
    {
        public int Id { get; set; }

        [Required]
        [ForeignKey("senderId")]
        public string SenderId { get; set; }
        public  ApplicationUser Sender { get; set; }
        
        [Required]

        [ForeignKey("receiverId")]
        public string ReceiverId { get; set; }

        public ApplicationUser Receiver { get; set; }

        [Required]
        public string Content { get; set; }

        public DateTime Timestamp { get; set; }
    }
}