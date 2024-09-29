// Controllers/ProfileController.cs

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MyBackendApp.Models;
using MyBackendApp.ViewModels;
using System.Threading.Tasks;
using System.IO;

namespace MyBackendApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public ProfileController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        [HttpPost("UpdateProfile")]
        public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileViewModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
                return Unauthorized("User is not authenticated.");

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            // Handle file upload
            if (model.ProfilePicture != null && model.ProfilePicture.Length > 0)
            {
                var uploadsFolder = Path.Combine("wwwroot", "uploads");
                Directory.CreateDirectory(uploadsFolder);

                // Use the userId as part of the file name to ensure uniqueness
                var uniqueFileName = $"{userId}{Path.GetExtension(model.ProfilePicture.FileName)}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await model.ProfilePicture.CopyToAsync(fileStream);
                }

                // Update the user's ProfilePictureUrl property
                user.ProfilePictureUrl = "/uploads/" + uniqueFileName;
            }
            
            Console.WriteLine("Yeehaw");

            // Update user properties
            user.FirstName = model.FirstName;
            user.LastName = model.LastName;
            user.Location = model.Location;
            user.Institution = model.Institution;
            user.Work = model.Work;
            user.Courses = model.Courses;
            user.Subjects = model.Subjects;
            user.AboutMe = model.AboutMe;
            user.Age = model.Age;
            user.CreatedProfile = true;

            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                return Ok("Profile updated successfully.");
            }

            var updateErrors = result.Errors.Select(e => e.Description);
            return BadRequest(new { Errors = updateErrors });
        }


        [HttpGet("GetProfile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
                return Unauthorized("User is not authenticated.");

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            var profile = new
            {
                user.UserName,
                user.Email,
                user.FirstName,
                user.LastName,
                user.Location,
                user.Institution,
                user.Work,
                user.Courses,
                user.Subjects,
                user.AboutMe,
                user.Age,
                ProfilePictureUrl = user.ProfilePictureUrl, // Use the correct property
                user.CreatedProfile
            };

            return Ok(profile);
        }
    }
}
