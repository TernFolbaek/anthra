using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MyBackendApp.Models;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using System;
using Microsoft.EntityFrameworkCore;
using MyBackendApp.Data;
using MyBackendApp.ViewModels;

namespace MyBackendApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class ConnectionsController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ConnectionsController> _logger;

        public ConnectionsController(UserManager<ApplicationUser> userManager, ApplicationDbContext context, ILogger<ConnectionsController> logger)
        {
            _userManager = userManager;
            _context = context;
            _logger = logger;
        }

        [HttpPost("SendRequest")]
        public async Task<IActionResult> SendRequest([FromBody] ConnectionRequestModel model)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation("CurrentUserId: {CurrentUserId}, TargetUserId: {TargetUserId}", currentUserId, model.TargetUserId);

            if (currentUserId == model.TargetUserId)
            {
                return BadRequest("You cannot connect with yourself.");
            }

            // Check if a connection request already exists between the two users
            var existingRequest = await _context.ConnectionRequests
                .FirstOrDefaultAsync(cr =>
                    (cr.SenderId == currentUserId && cr.ReceiverId == model.TargetUserId) ||
                    (cr.SenderId == model.TargetUserId && cr.ReceiverId == currentUserId));

            if (existingRequest != null)
            {
                if (existingRequest.Status == ConnectionStatus.Accepted)
                {
                    return BadRequest("You are already connected.");
                }
                else if (existingRequest.Status == ConnectionStatus.Pending)
                {
                    if (existingRequest.SenderId == model.TargetUserId)
                    {
                        // Accept the request
                        existingRequest.Status = ConnectionStatus.Accepted;
                        existingRequest.RespondedAt = DateTime.UtcNow;

                        // Create a new Connection
                        var connection = new Connection
                        {
                            UserId1 = existingRequest.SenderId,
                            UserId2 = existingRequest.ReceiverId,
                            ConnectedAt = DateTime.UtcNow
                        };
                        _context.Connections.Add(connection);

                        await _context.SaveChangesAsync();
                        return Ok("Connection request accepted.");
                    }
                    else
                    {
                        return BadRequest("Connection request already sent.");
                    }
                }
                else if (existingRequest.Status == ConnectionStatus.Declined)
                {
                    // A previous request was declined; we can allow sending a new request
                    // Update the existing request
                    existingRequest.Status = ConnectionStatus.Pending;
                    existingRequest.RequestedAt = DateTime.UtcNow;
                    existingRequest.RespondedAt = null;

                    await _context.SaveChangesAsync();
                    return Ok("Connection request sent.");
                }
            }
            else
            {
                // No existing request between the two users
                // Create a new pending request
                var connectionRequest = new ConnectionRequest
                {
                    SenderId = currentUserId,
                    ReceiverId = model.TargetUserId,
                    Status = ConnectionStatus.Pending,
                    RequestedAt = DateTime.UtcNow
                };

                _context.ConnectionRequests.Add(connectionRequest);
                await _context.SaveChangesAsync();
                
                // After adding the connection request
                // Create a notification
                var sender = await _context.Users.FindAsync(currentUserId);

                var notification = new Notification
                {
                    UserId = model.TargetUserId,
                    Type = "ConnectionRequest",
                    Content = $"{sender.FirstName} sent you a connection request.",
                    Timestamp = DateTime.UtcNow,
                    IsRead = false,
                    SenderId = sender.Id,
                    SenderName = sender.FirstName
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();


                return Ok("Connection request sent.");
            }
            return BadRequest("Unable to process the connection request.");
        }
        
        [HttpGet("List")]
        public async Task<IActionResult> GetConnections([FromQuery] string userId)
        {
            
            var connections = await _context.Connections
                .Include(c => c.User1)
                .Include(c => c.User2)
                .Where(c => c.UserId1 == userId || c.UserId2 == userId)
                .Select(c => new
                {
                    ConnectionId = c.Id,
                    ConnectedUser = c.UserId1 == userId ? c.User2 : c.User1,
                    ConnectedAt = c.ConnectedAt
                })
                .ToListAsync();

            var result = connections.Select(c => new
            {
                Id = c.ConnectedUser.Id,
                FirstName = c.ConnectedUser.FirstName,
                ProfilePictureUrl = c.ConnectedUser.ProfilePictureUrl,
                ConnectedAt = c.ConnectedAt
            });

            return Ok(result);
        }
        
        [HttpGet("ConnectionsGroupList")]
        public async Task<IActionResult> GetConnectionsGroupList([FromQuery] string userId)
        {
            var connections = await _context.Connections
                .Include(c => c.User1)
                .Include(c => c.User2)
                .Where(c => c.UserId1 == userId || c.UserId2 == userId)
                .ToListAsync();

            var connectedUsers = new List<ApplicationUser>();

            foreach (var connection in connections)
            {
                if (connection.UserId1 == userId && connection.User2 != null)
                {
                    connectedUsers.Add(connection.User2);
                }
                else if (connection.UserId2 == userId && connection.User1 != null)
                {
                    connectedUsers.Add(connection.User1);
                }
            }

            var result = connectedUsers.Select(u => new
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                ProfilePictureUrl = u.ProfilePictureUrl
            });

            return Ok(result);
        }
        
        
        [HttpPost("RemoveConnection")]
        public async Task<IActionResult> RemoveConnection([FromBody] RemoveConnectionViewModel model)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (currentUserId == null)
                return Unauthorized("User is not authenticated.");

            if (currentUserId != model.UserId)
                return BadRequest("You can only remove connections from your own account.");

            // Find the connection between the two users
            var connection = await _context.Connections
                .FirstOrDefaultAsync(c =>
                    (c.UserId1 == model.UserId && c.UserId2 == model.ConnectionId) ||
                    (c.UserId1 == model.ConnectionId && c.UserId2 == model.UserId)
                );

            if (connection == null)
                return NotFound("Connection not found.");

            // Remove the connection
            _context.Connections.Remove(connection);
            await _context.SaveChangesAsync();
            
            var conversation = await _context.Messages
                .Where(m => (m.SenderId == model.UserId && m.ReceiverId == model.ConnectionId) ||
                            (m.SenderId == model.ConnectionId && m.ReceiverId == model.UserId))
                .ToListAsync();


            _context.Messages.RemoveRange(conversation);

            return Ok("Connection removed successfully.");
        }
    }
}