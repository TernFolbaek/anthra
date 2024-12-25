using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using MyBackendApp.Attributes;

namespace MyBackendApp.Models
{
    public class GroupMessage
    {
        public int Id { get; set; }

        [Required]
        public int GroupId { get; set; }

        [JsonIgnore]
        [ValidateNever]
        public Group Group { get; set; }


        public string? SenderId { get; set; }

        [JsonIgnore]
        [ValidateNever]
        public ApplicationUser? Sender { get; set; }

        [RequiredIfNoAttachment(ErrorMessage = "Either provide content or attach a file.")]
        public string? Content { get; set; }

        public DateTime Timestamp { get; set; }
        
        public Attachment? Attachment { get; set; }

    }
}