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
    [Authorize]
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

            // 1) Exclude connected, requested, or skipped users
            var connectedUserIds = await _context.Connections
                .Where(c => c.UserId1 == currentUserId || c.UserId2 == currentUserId)
                .Select(c => c.UserId1 == currentUserId ? c.UserId2 : c.UserId1)
                .ToListAsync();

            var sentRequestUserIds = await _context.ConnectionRequests
                .Where(cr => cr.SenderId == currentUserId && cr.Status == ConnectionStatus.Pending)
                .Select(cr => cr.ReceiverId)
                .ToListAsync();

            var skippedUserIds = await _context.SkippedUsers
                .Where(su => su.UserId == currentUserId)
                .Select(su => su.SkippedUserId)
                .ToListAsync();

            var excludedUserIds = connectedUserIds
                .Concat(sentRequestUserIds)
                .Concat(skippedUserIds)
                .Append(currentUserId)
                .ToList();

            // 2) Return up to 10
            var users = await _userManager.Users
                .AsNoTracking()
                .Where(u => u.ProfileCompleted && !excludedUserIds.Contains(u.Id))
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
                    u.Statuses,
                    u.AboutMe,
                    u.Age,
                    u.ProfilePictureUrl
                })
                .Take(8)  // Only take 8 at once
                .ToListAsync();

            return Ok(users);
        }



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