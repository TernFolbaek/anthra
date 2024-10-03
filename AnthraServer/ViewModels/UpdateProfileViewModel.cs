// ViewModels/UpdateProfileViewModel.cs
using System.Collections.Generic;

namespace MyBackendApp.ViewModels
{
    public class UpdateProfileViewModel
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Location { get; set; }
        public string? Institution { get; set; }
        public string? Work { get; set; }
        public List<string?> Courses { get; set; }
        public List<string>? Subjects { get; set; }
        public string? AboutMe { get; set; }
        public int? Age { get; set; }
        public IFormFile ProfilePicture { get; set; }
    }
}