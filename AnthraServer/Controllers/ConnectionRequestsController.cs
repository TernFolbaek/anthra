using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyBackendApp.Data;
using MyBackendApp.Models;

namespace MyBackendApp.Controllers
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
                        SenderName = cr.Sender.UserName, // Adjust as necessary
                        SenderEmail = cr.Sender.Email,
                        SenderProfilePicture = cr.Sender.ProfilePictureUrl, // Adjust field name
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
        public async Task<IActionResult> AcceptRequest(int requestId)
        {
            var connectionRequest = await _context.ConnectionRequests.FindAsync(requestId);

            if (connectionRequest == null)
            {
                return NotFound("Connection request not found.");
            }

            connectionRequest.Status = ConnectionStatus.Accepted;
            connectionRequest.RespondedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok("Connection request accepted.");
        }

        [HttpPost("DeclineRequest")]
        public async Task<IActionResult> DeclineRequest(int requestId)
        {
            var connectionRequest = await _context.ConnectionRequests.FindAsync(requestId);

            if (connectionRequest == null)
            {
                return NotFound("Connection request not found.");
            }

            connectionRequest.Status = ConnectionStatus.Declined;
            connectionRequest.RespondedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok("Connection request declined.");
        }
    }
}
