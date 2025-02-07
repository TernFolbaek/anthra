// ViewModels/UpdateProfileViewModel.cs
using System.Collections.Generic;
using MyBackendApp.Models;

namespace MyBackendApp.ViewModels
{
    public class UpdateProfileViewModel
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Location { get; set; }
        public string? Institution { get; set; }
        public string? Work { get; set; }
        public string? Courses { get; set; } // JSON string of courses
        public List<string>? Subjects { get; set; }
        
        public List<string>? Statuses { get; set; }

        public string? AboutMe { get; set; }
        public string? AllowEmailUpdates { get; set; }  
        public bool? IsProfileVisible { get; set; } 
        public StageOfLife StageOfLife { get; set; }
        public string? SelfStudyingSubjects { get; set; }

        public int? Age { get; set; }
        public IFormFile? ProfilePicture { get; set; }
    }
}