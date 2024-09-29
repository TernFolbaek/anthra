using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MyBackendApp.Models;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using MyBackendApp.Data;

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
        public IActionResult GetUsers()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var connectedUserIds = _context.ConnectionRequests
                .Where(cr => (cr.SenderId == currentUserId || cr.ReceiverId == currentUserId))
                .Select(cr => cr.SenderId == currentUserId ? cr.ReceiverId : cr.SenderId)
                .ToList();

            // Exclude the current user
            var users = _userManager.Users
                .Where(u => u.Id != currentUserId)
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
                .ToList();

            return Ok(users);
        }
    }
}