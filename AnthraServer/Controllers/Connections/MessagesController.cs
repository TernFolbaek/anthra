using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MyBackendApp.Data;
using MyBackendApp.Hubs;
using MyBackendApp.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using MyBackendApp.ViewModels;

namespace MyBackendApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public MessagesController(ApplicationDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }
        
        [HttpGet("GetConversations")]
        public async Task<IActionResult> GetConversations(string userId)
        {
            var messagesQuery = _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => m.SenderId == userId || m.ReceiverId == userId);

            var conversations = await messagesQuery
                .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                .Select(g => new ConversationDTO
                {
                    UserId = g.Key,
                    UserName = g.Select(m => m.SenderId == g.Key ? m.Sender.UserName : m.Receiver.UserName).FirstOrDefault(),
                    UserEmail = g.Select(m => m.SenderId == g.Key ? m.Sender.Email : m.Receiver.Email).FirstOrDefault(),
                    UserProfilePicture = g.Select(m => m.SenderId == g.Key ? m.Sender.ProfilePictureUrl : m.Receiver.ProfilePictureUrl).FirstOrDefault(),
                    LastMessageContent = g.OrderByDescending(m => m.Timestamp).Select(m => m.Content).FirstOrDefault(),
                    LastMessageTimestamp = g.Max(m => m.Timestamp)
                })
                .ToListAsync();

            return Ok(conversations);
        }

        [HttpGet("GetChatHistory")]
        public async Task<IActionResult> GetChatHistory(string userId, string contactId)
        {
            var messages = await _context.Messages
                .Where(m =>
                    (m.SenderId == userId && m.ReceiverId == contactId) ||
                    (m.SenderId == contactId && m.ReceiverId == userId))
                .OrderBy(m => m.Timestamp)
                .ToListAsync();

            return Ok(messages);
        }

        [HttpPost("SendMessage")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageModel model)
        {
            
            if (!ModelState.IsValid)
            {
                return BadRequest("Invalid message data.");
            }

            var message = new Message
            {
                SenderId = model.SenderId,
                ReceiverId = model.ReceiverId,
                Content = model.Content,
                Timestamp = DateTime.UtcNow
            };


            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Send message via SignalR
            var groupId = GetChatGroupId(message.SenderId, message.ReceiverId);
            await _hubContext.Clients.Group(groupId).SendAsync("ReceiveMessage", message);

            return Ok();
        }

        private string GetChatGroupId(string userA, string userB)
        {
            return string.CompareOrdinal(userA, userB) < 0 ? $"{userA}-{userB}" : $"{userB}-{userA}";
        }
    }
}