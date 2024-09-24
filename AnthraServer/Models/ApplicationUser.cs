// Models/ApplicationUser.cs
using Microsoft.AspNetCore.Identity;

namespace MyBackendApp.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Location { get; set; }
        public string? Institution { get; set; }
        public string? Work { get; set; }
        public string? Course { get; set; }
        public List<string>? Subjects { get; set; } // Use a collection type
        public string? AboutMe { get; set; }
        public int? Age { get; set; }
        public string? ProfilePictureUrl { get; set; } // URL or path to the picture
        public bool CreatedProfile { get; set; } = false; // Default to false
    }
}