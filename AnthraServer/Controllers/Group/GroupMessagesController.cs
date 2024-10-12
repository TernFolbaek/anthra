using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MyBackendApp.Data;
using MyBackendApp.Hubs;
using MyBackendApp.Models;
using MyBackendApp.ViewModels;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MyBackendApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GroupMessagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public GroupMessagesController(ApplicationDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet("GetGroupChatHistory")]
        public async Task<IActionResult> GetGroupChatHistory(int groupId)
        {
            var messages = await _context.GroupMessages
                .Include(m => m.Sender)
                .Where(m => m.GroupId == groupId)
                .OrderBy(m => m.Timestamp)
                .Select(m => new
                {
                    m.Id,
                    m.Content,
                    m.Timestamp,
                    SenderId = m.SenderId,
                    SenderFirstName = m.Sender.FirstName,
                    SenderProfilePictureUrl = m.Sender.ProfilePictureUrl
                })
                .ToListAsync();

            return Ok(messages);
        }

        [HttpPost("SendGroupMessage")]
        public async Task<IActionResult> SendGroupMessage([FromBody] SendGroupMessageModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest("Invalid message data.");
            }

            // Check if the sender is a member of the group
            var isMember = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == model.GroupId && gm.UserId == model.SenderId);

            if (!isMember)
            {
                return Forbid("You are not a member of this group.");
            }

            var message = new GroupMessage
            {
                GroupId = model.GroupId,
                SenderId = model.SenderId,
                Content = model.Content,
                Timestamp = DateTime.UtcNow
            };

            _context.GroupMessages.Add(message);
            await _context.SaveChangesAsync();

            // Send the message via SignalR
            var groupName = $"Group_{model.GroupId}";
            await _hubContext.Clients.Group(groupName).SendAsync("ReceiveGroupMessage", new
            {
                message.Id,
                message.Content,
                message.Timestamp,
                SenderId = message.SenderId,
                SenderFirstName = (await _context.Users.FindAsync(message.SenderId))?.FirstName,
                SenderProfilePictureUrl = (await _context.Users.FindAsync(message.SenderId))?.ProfilePictureUrl,
                GroupId = message.GroupId
            });

            return Ok();
        }
    }
}
