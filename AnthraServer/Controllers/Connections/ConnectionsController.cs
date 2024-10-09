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

                return Ok("Connection request sent.");
            }
            return BadRequest("Unable to process the connection request.");
        }
    }
}