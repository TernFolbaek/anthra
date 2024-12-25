using System;
using System.ComponentModel.DataAnnotations;
using MyBackendApp.Attributes; // <-- Important: import the custom attribute namespace
using Microsoft.AspNetCore.Http; // For IFormFile

namespace MyBackendApp.ViewModels
{
    public class SendMessageModel
    {
        [Required]
        public string SenderId { get; set; }

        [Required]
        public string ReceiverId { get; set; }

        // Use our custom attribute instead of [Required]
        [RequiredIfNoFile("File", ErrorMessage = "Either provide content or attach a file.")]
        public string? Content { get; set; }

        public bool IsReferralCard { get; set; }

        public IFormFile? File { get; set; }
    }
}