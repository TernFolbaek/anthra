using System.Security.Claims;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MyBackendApp.Models;
using MyBackendApp.ViewModels;
using Newtonsoft.Json;

namespace AnthraBackend.Controllers.Account
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProfileController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly string _storageConnectionString =
            "BlobEndpoint=https://anthra.blob.core.windows.net/;QueueEndpoint=https://anthra.queue.core.windows.net/;FileEndpoint=https://anthra.file.core.windows.net/;TableEndpoint=https://anthra.table.core.windows.net/;SharedAccessSignature=sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2026-10-01T16:15:49Z&st=2024-10-01T08:15:49Z&spr=https&sig=SHmifWmLLf50pO0nqEVnIBYTqRx0QHmJpS5iAiYXq%2F0%3D";
        private readonly string _containerName = "profile-pictures";

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

    // Handle courses (JSON string)
    if (!string.IsNullOrEmpty(model.Courses))
    {
        try
        {
            user.Courses = JsonConvert.DeserializeObject<List<Course>>(model.Courses);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = "Invalid courses format.", Details = ex.Message });
        }
    }

    // Update common properties
    user.FirstName = model.FirstName;
    user.LastName = model.LastName;
    user.Location = model.Location;
    user.AboutMe = model.AboutMe;
    user.Age = model.Age;
    user.Subjects = model.Subjects;
    user.Statuses = (model.Statuses != null && model.Statuses.Any()) ? model.Statuses : user.Statuses;
    user.CreatedProfile = true;
    user.ProfileCompleted = true;
    
    if (!string.IsNullOrEmpty(model.AllowEmailUpdates))
    {
        if (bool.TryParse(model.AllowEmailUpdates, out bool allowEmailUpdates))
        {
            user.AllowEmailUpdates = allowEmailUpdates;
        }
        else
        {
            return BadRequest(new { Error = "AllowEmailUpdates must be a valid boolean value." });
        }
    }

    // Update StageOfLife
    user.StageOfLife = model.StageOfLife;

    // Update additional properties based on StageOfLife
    switch (model.StageOfLife)
    {
        case StageOfLife.Student:
            user.Institution = model.Institution;
            // Courses already handled above
            break;

        case StageOfLife.Professional:
            // Assuming your model has "AreaOfWork" on the view model but your ApplicationUser property is "Work"
            user.Work = model.Work;
            break;

        case StageOfLife.SelfStudying:
            if (!string.IsNullOrEmpty(model.SelfStudyingSubjects))
            {
                try
                {
                    user.SelfStudyingSubjects = JsonConvert.DeserializeObject<List<string>>(model.SelfStudyingSubjects);
                }
                catch (Exception ex)
                {
                    return BadRequest(new { Error = "Invalid SelfStudyingSubjects format.", Details = ex.Message });
                }
            }
            else
            {
                // Optionally clear or initialize if none is provided
                user.SelfStudyingSubjects = new List<string>();
            }
            break;

        default:
            // Optionally clear fields that are not relevant for the new stage
            user.SelfStudyingSubjects = null;
            break;
    }

    // Handle profile picture upload
    if (model.ProfilePicture != null && model.ProfilePicture.Length > 0)
    {
        long maxSizeInBytes = 5 * 1024 * 1024;  // 5 MB limit, adjust as needed
        if (model.ProfilePicture.Length > maxSizeInBytes)
        {
            return BadRequest(new { Error = "File size must be less than 5MB." });
        }
        
        // Delete the existing profile picture from Azure if it exists
        if (!string.IsNullOrEmpty(user.ProfilePictureUrl))
        {
            await DeleteProfilePictureFromAzure(user.ProfilePictureUrl);
        }

        // Upload new profile picture to Azure Blob Storage
        var blobUrl = await UploadProfilePictureToAzure(userId, model.ProfilePicture);
        user.ProfilePictureUrl = blobUrl;
    }

    var result = await _userManager.UpdateAsync(user);
    if (result.Succeeded)
    {
        return Ok(new
        {
            Message = "Profile updated successfully.",
            profilePictureUrl = user.ProfilePictureUrl
        });
    }

    var updateErrors = result.Errors.Select(e => e.Description);
    return BadRequest(new { Errors = updateErrors });
}

        [HttpPost("SetProfileVisibility")]
        [Authorize]
        public async Task<IActionResult> SetProfileVisibility([FromBody] bool isProfileVisible)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User is not authenticated.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound("User not found.");

            // Update the visibility and save
            user.IsProfileVisible = isProfileVisible;
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                var updateErrors = result.Errors.Select(e => e.Description);
                return BadRequest(new { Errors = updateErrors });
            }

            return Ok(new
            {
                Message = $"Profile visibility updated to {isProfileVisible}."
            });
        }


        [HttpPost("SetEmailUpdates")]
        [Authorize]
        public async Task<IActionResult> SetEmailUpdates([FromBody] string allowEmailUpdates)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User is not authenticated.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound("User not found.");

            // Convert "true"/"false" string to bool
            bool parsedValue = bool.TryParse(allowEmailUpdates, out var resultValue) && resultValue;

            // Update your user (which might store it as a string or a bool, depending on your design)
            // If your ApplicationUser has a bool property, do:
            // user.AllowEmailUpdates = parsedValue;
            // Or if you want to store the string directly:
            // user.AllowEmailUpdatesString = allowEmailUpdates; 

            user.AllowEmailUpdates = parsedValue; 
            // (If you are storing it as a string property in your DB.)
    
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var updateErrors = result.Errors.Select(e => e.Description);
                return BadRequest(new { Errors = updateErrors });
            }

            return Ok(new
            {
                Message = $"Email updates allowed: {allowEmailUpdates}."
            });
        }



        [HttpGet("GetProfile")]
        [Authorize]
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
                user.Email,
                user.FirstName,
                user.LastName,
                user.Location,
                user.Institution,
                user.Work,
                user.Courses,
                user.Subjects,
                user.SelfStudyingSubjects,
                user.AboutMe,
                user.Age,
                user.ProfilePictureUrl,
                user.CreatedProfile,
                user.Statuses,
                user.StageOfLife,
            };

            return Ok(profile);
        }

        [HttpGet("GetProfileById")]
        [Authorize]
        public async Task<IActionResult> GetProfileById(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            var profile = new
            {
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                user.Location,
                user.Institution,
                user.Work,
                user.Courses,
                user.Subjects,
                user.SelfStudyingSubjects,
                user.AboutMe,
                user.Age,
                user.ProfilePictureUrl,
                user.CreatedProfile,
                user.Statuses,
                user.StageOfLife,
            };

            return Ok(profile);
        }

        private async Task<string> UploadProfilePictureToAzure(string userId, IFormFile profilePicture)
        {
            // Create a BlobServiceClient
            BlobServiceClient blobServiceClient = new BlobServiceClient(_storageConnectionString);

            // Get the container client
            BlobContainerClient containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

            // Create the container if it does not exist
            await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

            // Generate a unique blob name using userId and timestamp
            string blobName = $"{userId}_{DateTime.UtcNow.Ticks}{Path.GetExtension(profilePicture.FileName)}";

            // Get the blob client
            BlobClient blobClient = containerClient.GetBlobClient(blobName);

            // Upload the image
            await using (var stream = profilePicture.OpenReadStream())
            {
                await blobClient.UploadAsync(stream, true);
            }

            // Return the URL to the uploaded image
            return blobClient.Uri.ToString();
        }

        private async Task DeleteProfilePictureFromAzure(string blobUrl)
        {
            try
            {
                // Parse the blob name from the URL
                Uri uri = new Uri(blobUrl);
                string blobName = Path.GetFileName(uri.LocalPath);

                // Create a BlobServiceClient
                BlobServiceClient blobServiceClient = new BlobServiceClient(_storageConnectionString);

                // Get the container client
                BlobContainerClient containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

                // Get the blob client
                BlobClient blobClient = containerClient.GetBlobClient(blobName);

                // Delete the blob if it exists
                await blobClient.DeleteIfExistsAsync();
            }
            catch (Exception ex)
            {
                // Log the exception (you might want to use a logger here)
                Console.WriteLine($"Error deleting blob: {ex.Message}");
                // Optionally, you can rethrow or handle the exception as needed
            }
        }
    }
}
