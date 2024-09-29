using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MyBackendApp.Models;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using System;
using MyBackendApp.Data;
using MyBackendApp.ViewModels;

namespace MyBackendApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ConnectionsController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;

        public ConnectionsController(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [HttpPost("SendRequest")]
        public async Task<IActionResult> SendRequest([FromBody] ConnectionRequestModel model)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (currentUserId == model.TargetUserId)
            {
                return BadRequest("You cannot connect with yourself.");
            }

            // Check if a connection request already exists
            var existingRequest = _context.ConnectionRequests
                .FirstOrDefault(cr => cr.SenderId == currentUserId && cr.ReceiverId == model.TargetUserId);

            if (existingRequest != null)
            {
                return BadRequest("Connection request already sent.");
            }

            var connectionRequest = new ConnectionRequest
            {
                SenderId = currentUserId,
                ReceiverId = model.TargetUserId,
                Status = ConnectionStatus.Pending,
                RequestedAt = DateTime.UtcNow
            };

            _context.ConnectionRequests.Add(connectionRequest);
            await _context.SaveChangesAsync();

            return Ok("Connection request sent.");
        }
    }
}