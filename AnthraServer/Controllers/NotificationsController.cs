// NotificationsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyBackendApp.Models;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using System;
using MyBackendApp.Data;

namespace MyBackendApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }
        
        [HttpGet("GetNotifications")]
        public async Task<IActionResult> GetNotifications()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var notifications = _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .OrderByDescending(n => n.Timestamp)
                .Select(n => new
                {
                    n.Id,
                    n.Type,
                    n.Content,
                    n.Timestamp,
                    n.IsRead,
                    n.SenderId,
                    n.SenderName,
                    n.GroupId,
                    n.MessageCount
                })
                .ToList();

            return Ok(notifications);
        }


        [HttpPost("MarkAsRead/{notificationId}")]
        public async Task<IActionResult> MarkAsRead(int notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);

            if (notification == null)
                return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}