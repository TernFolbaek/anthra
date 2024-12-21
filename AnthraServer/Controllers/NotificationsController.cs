// NotificationsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyBackendApp.Models;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using System;
using MyBackendApp.Data;
using Microsoft.AspNetCore.SignalR;
using MyBackendApp.Hubs; // Ensure this matches your project's namespace

namespace MyBackendApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationsController(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
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
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var notification = await _context.Notifications.FindAsync(notificationId);

            if (notification == null)
                return NotFound();

            if (notification.UserId != userId)
                return Forbid(); // Ensure users can only mark their own notifications

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            // Emit the updated notification to the specific user
            await _hubContext.Clients.User(userId).SendAsync("UpdateNotification", notification);

            return Ok();
        }

        [HttpPost("MarkAllAsRead")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var unreadNotifications = _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToList();

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            // Emit the updated notifications to the specific user
            await _hubContext.Clients.User(userId).SendAsync("UpdateNotifications", unreadNotifications);

            return Ok();
        }
    }
}
