using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyBackendApp.Data;
using MyBackendApp.Models;
using MyBackendApp.ViewModels;

namespace AnthraBackend.Controllers.Connections
{
    [ApiController]
    [Route("api/[controller]")]
    public class RequestController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RequestController> _logger;

        public RequestController(ApplicationDbContext context, ILogger<RequestController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("Pending")]
        public async Task<IActionResult> GetPendingRequests(string userId)
        {
            try
            {
                var pendingRequests = await _context.ConnectionRequests
                    .Include(cr => cr.Sender)
                    .Include(cr => cr.Receiver)
                    .Where(cr => cr.Status == ConnectionStatus.Pending &&
                                 cr.ReceiverId == userId)
                    .Select(cr => new ConnectionRequestDTO
                    {
                        Id = cr.Id,
                        SenderId = cr.SenderId,
                        SenderFirstName = cr.Sender.FirstName,
                        SenderLastName = cr.Sender.LastName,
                        SenderEmail = cr.Sender.Email,
                        SenderProfilePicture = cr.Sender.ProfilePictureUrl, 
                        ReceiverId = cr.ReceiverId,
                        Status = cr.Status,
                        RequestedAt = cr.RequestedAt,
                        RespondedAt = cr.RespondedAt
                    })
                    .ToListAsync();

                return Ok(pendingRequests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching pending requests for user {UserId}", userId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }


        [HttpGet("Accepted")]
        public async Task<IActionResult> GetAcceptedConnections(string userId)
        {
            var acceptedConnections = await _context.ConnectionRequests
                .Include(cr => cr.Sender)
                .Include(cr => cr.Receiver)
                .Where(cr => cr.Status == ConnectionStatus.Accepted &&
                             (cr.SenderId == userId || cr.ReceiverId == userId))
                .Select(cr => new ConnectionRequestDTO
                {
                    Id = cr.Id,
                    SenderId = cr.SenderId,
                    SenderName = cr.Sender.UserName, // Assuming UserName is the name you need
                    SenderEmail = cr.Sender.Email,
                    SenderProfilePicture = cr.Sender.ProfilePictureUrl, // Adjust field name accordingly
                    ReceiverId = cr.ReceiverId,
                    Status = cr.Status,
                    RequestedAt = cr.RequestedAt,
                    RespondedAt = cr.RespondedAt
                })
                .ToListAsync();

            return Ok(acceptedConnections);
        }

        [HttpPost("AcceptRequest")]
        [Authorize]
        public async Task<IActionResult> AcceptRequest(int requestId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var connectionRequest = await _context.ConnectionRequests
                .FirstOrDefaultAsync(cr => cr.Id == requestId && cr.ReceiverId == currentUserId);

            if (connectionRequest == null)
            {
                return NotFound("Connection request not found or you are not authorized to accept it.");
            }

            if (connectionRequest.Status != ConnectionStatus.Pending)
            {
                return BadRequest("This connection request has already been processed.");
            }

            connectionRequest.Status = ConnectionStatus.Accepted;
            connectionRequest.RespondedAt = DateTime.UtcNow;

            // Create a new Connection entry
            var connection = new Connection
            {
                UserId1 = connectionRequest.SenderId,
                UserId2 = connectionRequest.ReceiverId,
                ConnectedAt = DateTime.UtcNow
            };
            _context.Connections.Add(connection);

            await _context.SaveChangesAsync();

            return Ok("Connection request accepted and users added to Connections table.");
        }


        [HttpPost("DeclineRequest")]
        public async Task<IActionResult> DeclineRequest([FromBody] ConnectionRequestModel model)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var existingRequest = await _context.ConnectionRequests
                .FirstOrDefaultAsync(cr =>
                    cr.SenderId == model.TargetUserId && cr.ReceiverId == currentUserId &&
                    cr.Status == ConnectionStatus.Pending);

            if (existingRequest != null)
            {
                existingRequest.Status = ConnectionStatus.Declined;
                existingRequest.RespondedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return Ok("Connection request declined.");
            }

            return BadRequest("No pending connection request found.");
        }

    }
}
