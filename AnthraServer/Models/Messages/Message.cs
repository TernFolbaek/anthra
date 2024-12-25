using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using MyBackendApp.Attributes; // Import the custom attribute's namespace

namespace MyBackendApp.Models
{
    public enum InvitationActionType
    {
        None,
        Skipped,
        Connected,
        Accepted,
        Declined
    }

    public class Message
    {
        public int Id { get; set; }

        [Required]
        public string SenderId { get; set; }

        [JsonIgnore]
        [ValidateNever]
        public ApplicationUser Sender { get; set; }

        [Required]
        public string ReceiverId { get; set; }

        [JsonIgnore]
        [ValidateNever]
        public ApplicationUser Receiver { get; set; }

        // Remove [Required] here; instead, apply our custom attribute
        [RequiredIfNoAttachment(ErrorMessage = "Either provide content or attach a file.")]
        public string? Content { get; set; }

        public DateTime Timestamp { get; set; }
        
        public int? GroupId { get; set; }
        
        public string? GroupName { get; set; }
        public bool IsGroupInvitation { get; set; }
        public bool IsReferralCard { get; set; }

        public Attachment Attachment { get; set; }
        
        public bool? InvitationStatus { get; set; }
        
        public InvitationActionType ActionType { get; set; } = InvitationActionType.None;
    }
}