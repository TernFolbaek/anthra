using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MyBackendApp.Models;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using MyBackendApp.Data;
using Microsoft.EntityFrameworkCore;

namespace MyBackendApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class ExploreController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;

        public ExploreController(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [HttpGet("GetUsers")]
        public async Task<IActionResult> GetUsers()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Get IDs of connected users (both sent and received requests)
            var connectedUserIds = await _context.ConnectionRequests
                .Where(cr => cr.SenderId == currentUserId || cr.ReceiverId == currentUserId)
                .Select(cr => cr.SenderId == currentUserId ? cr.ReceiverId : cr.SenderId)
                .ToListAsync();

            // Get IDs of users skipped by the current user
            var skippedUserIds = await _context.SkippedUsers
                .Where(su => su.UserId == currentUserId)
                .Select(su => su.SkippedUserId)
                .ToListAsync();

            // Combine all user IDs to exclude
            var excludedUserIds = connectedUserIds
                .Concat(skippedUserIds)
                .Append(currentUserId)
                .ToList();

            // Fetch users excluding the ones in excludedUserIds
            var users = await _userManager.Users
                .Where(u => !excludedUserIds.Contains(u.Id))
                .Select(u => new
                {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Location,
                    u.Institution,
                    u.Work,
                    u.Courses,
                    u.Subjects,
                    u.AboutMe,
                    u.Age,
                    u.ProfilePictureUrl
                })
                .ToListAsync();

            return Ok(users);
        }

        // Add an endpoint to record skipped users
        [HttpPost("SkipUser")]
        public async Task<IActionResult> SkipUser([FromBody] SkipUserModel model)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (currentUserId == model.UserIdToSkip)
            {
                return BadRequest("You cannot skip yourself.");
            }

            // Check if the skip record already exists
            var existingSkip = await _context.SkippedUsers
                .FirstOrDefaultAsync(su => su.UserId == currentUserId && su.SkippedUserId == model.UserIdToSkip);

            if (existingSkip != null)
            {
                return BadRequest("User already skipped.");
            }

            var skippedUser = new SkippedUserModel
            {
                UserId = currentUserId,
                SkippedUserId = model.UserIdToSkip,
                SkippedAt = DateTime.UtcNow
            };

            _context.SkippedUsers.Add(skippedUser);
            await _context.SaveChangesAsync();

            return Ok();
        }
    }

    public class SkipUserModel
    {
        public string UserIdToSkip { get; set; }
    }
}
