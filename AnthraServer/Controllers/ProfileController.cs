// Controllers/ProfileController.cs

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MyBackendApp.Models;
using MyBackendApp.ViewModels;
using System.Threading.Tasks;

namespace MyBackendApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public ProfileController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        [HttpPost("UpdateProfile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileViewModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            // Update user properties
            user.FirstName = model.FirstName;
            user.LastName = model.LastName;
            user.Location = model.Location;
            user.Institution = model.Institution;
            user.Work = model.Work;
            user.Course = model.Course;
            user.Subjects = model.Subjects;
            user.AboutMe = model.AboutMe;
            user.Age = model.Age;
            user.ProfilePictureUrl = model.ProfilePictureUrl;
            user.CreatedProfile = true; // Set to true after profile completion

            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                return Ok("Profile updated successfully.");
            }

            // Handle errors
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }

            return BadRequest(ModelState);
        }
    }
}
