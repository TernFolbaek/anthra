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

        [HttpGet("Status")]
        [Authorize]
        public async Task<IActionResult> GetConnectionStatus([FromQuery] string targetUserId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized("User is not authenticated.");

            if (currentUserId == targetUserId)
            {
                return BadRequest("Cannot determine connection status for the same user.");
            }

            // Check if already connected
            var isConnected = await _context.Connections.AnyAsync(
                c => (c.UserId1 == currentUserId && c.UserId2 == targetUserId) ||
                     (c.UserId1 == targetUserId && c.UserId2 == currentUserId));

            // Check if a request is pending
            var pendingRequest = await _context.ConnectionRequests.FirstOrDefaultAsync(cr =>
                ((cr.SenderId == currentUserId && cr.ReceiverId == targetUserId) )
                && cr.Status == ConnectionStatus.Pending);
            
            // Check if a request has been accepted
            var acceptedRequest = await _context.ConnectionRequests.FirstOrDefaultAsync(cr =>
                ((cr.SenderId == currentUserId && cr.ReceiverId == targetUserId) ||
                 (cr.SenderId == targetUserId && cr.ReceiverId == currentUserId))
                && cr.Status == ConnectionStatus.Accepted);
            

            bool requestPending = pendingRequest != null;
            bool hasUserSentRequest = requestPending && pendingRequest.SenderId == currentUserId;
            
            bool requestAccepted = acceptedRequest != null;
            bool hasUserAcceptedRequest = requestAccepted && acceptedRequest.SenderId == currentUserId;

            return Ok(new { isConnected, requestPending, hasUserSentRequest, hasUserAcceptedRequest });
        }
        

[HttpGet("Statuses")]
[Authorize]
public async Task<IActionResult> GetConnectionStatuses([FromQuery] List<string> targetUserIds)
{
    var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

    if (string.IsNullOrEmpty(currentUserId))
        return Unauthorized("User is not authenticated.");

    // Remove current userId from targetUserIds if present
    targetUserIds = targetUserIds.Where(id => id != currentUserId).ToList();

    if (!targetUserIds.Any())
        return BadRequest("No valid targetUserIds provided.");

    // Fetch all connections where the current user is involved
    var connections = await _context.Connections
        .Where(c => (c.UserId1 == currentUserId && targetUserIds.Contains(c.UserId2)) ||
                    (c.UserId2 == currentUserId && targetUserIds.Contains(c.UserId1)))
        .ToListAsync();

    // Fetch all pending sent connection requests
    var pendingSentRequests = await _context.ConnectionRequests
        .Where(cr => cr.SenderId == currentUserId &&
                     targetUserIds.Contains(cr.ReceiverId) &&
                     cr.Status == ConnectionStatus.Pending)
        .ToListAsync();

    // Fetch all pending received connection requests
    var pendingReceivedRequests = await _context.ConnectionRequests
        .Where(cr => cr.ReceiverId == currentUserId &&
                     targetUserIds.Contains(cr.SenderId) &&
                     cr.Status == ConnectionStatus.Pending)
        .ToListAsync();

    // Fetch all accepted connection requests
    var acceptedRequests = await _context.ConnectionRequests
        .Where(cr => (cr.SenderId == currentUserId || cr.ReceiverId == currentUserId) &&
                     targetUserIds.Contains(cr.SenderId == currentUserId ? cr.ReceiverId : cr.SenderId) &&
                     cr.Status == ConnectionStatus.Accepted)
        .ToListAsync();

    // Prepare the status list
    var statusList = new List<ConnectionStatusDto>();

    foreach (var targetUserId in targetUserIds)
    {
        bool isConnected = connections.Any(c => c.UserId1 == targetUserId || c.UserId2 == targetUserId);
        bool requestPending = pendingSentRequests.Any(cr => cr.ReceiverId == targetUserId) ||
                               pendingReceivedRequests.Any(cr => cr.SenderId == targetUserId);
        bool hasUserSentRequest = pendingSentRequests.Any(cr => cr.ReceiverId == targetUserId);
        bool hasUserAcceptedRequest = acceptedRequests.Any(cr =>
            (cr.SenderId == currentUserId && cr.ReceiverId == targetUserId) ||
            (cr.SenderId == targetUserId && cr.ReceiverId == currentUserId));

        statusList.Add(new ConnectionStatusDto
        {
            TargetUserId = targetUserId,
            IsConnected = isConnected,
            RequestPending = requestPending,
            HasUserSentRequest = hasUserSentRequest,
            HasUserAcceptedRequest = hasUserAcceptedRequest
        });
    }

    return Ok(statusList);
}

    

   



        [HttpPost("RevokeRequest")]
        [Authorize]
        public async Task<IActionResult> RevokeRequest([FromBody] ConnectionRequestModel model)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (currentUserId == null)
                return Unauthorized("User is not authenticated.");

            // Find a pending request from current user to the target user
            var existingRequest = await _context.ConnectionRequests
                .FirstOrDefaultAsync(cr =>
                    cr.SenderId == currentUserId && 
                    cr.ReceiverId == model.TargetUserId && 
                    cr.Status == ConnectionStatus.Pending);

            if (existingRequest == null)
            {
                return BadRequest("No pending request found to revoke.");
            }

            _context.ConnectionRequests.Remove(existingRequest);
            await _context.SaveChangesAsync();

            return Ok("Connection request revoked.");
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
                c.ConnectedUser.Id,
                c.ConnectedUser.FirstName,
                c.ConnectedUser.LastName,
                c.ConnectedUser.ProfilePictureUrl,
                c.ConnectedUser.Institution,
                c.ConnectedAt,
                
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

            // Remove the conversation messages
            var conversation = await _context.Messages
                .Where(m => (m.SenderId == model.UserId && m.ReceiverId == model.ConnectionId) ||
                            (m.SenderId == model.ConnectionId && m.ReceiverId == model.UserId))
                .ToListAsync();

            _context.Messages.RemoveRange(conversation);

            // Save changes to the database
            await _context.SaveChangesAsync();

            return Ok("Connection removed successfully.");
        }

    }
}