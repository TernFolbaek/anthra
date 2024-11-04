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
        private readonly IHubContext<NotificationHub> _notificationHub;

        public MessagesController(ApplicationDbContext context, IHubContext<ChatHub> hubContext, IHubContext<NotificationHub> notificationHub)
        {
            _context = context;
            _hubContext = hubContext;
            _notificationHub = notificationHub;
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
                    LastMessageTimestamp = g.Max(m => m.Timestamp),
                    LastMessageSenderId = g.OrderByDescending(m => m.Timestamp).Select(m => m.SenderId).FirstOrDefault()
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
                    (m.SenderId == contactId && m.ReceiverId == userId) ||
                    (m.ReceiverId == userId && m.IsGroupInvitation))
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
            
            var sender = await _context.Users.FindAsync(message.SenderId);

            var notification = new Notification
            {
                UserId = message.ReceiverId,
                Type = "Message",
                Content = $"{sender.FirstName} sent you a message.",
                Timestamp = DateTime.UtcNow,
                IsRead = false,
                SenderId = sender.Id,
                SenderName = sender.FirstName
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            
            await _notificationHub.Clients.Group($"User_{notification.UserId}")
                .SendAsync("ReceiveNotification", new
                {
                    notification.Id,
                    notification.Type,
                    notification.Content,
                    notification.Timestamp,
                    notification.IsRead,
                    notification.SenderId,
                    notification.SenderName
                });

            // Send message via SignalR
            var groupId = GetChatGroupId(message.SenderId, message.ReceiverId);
            await _hubContext.Clients.Group(groupId).SendAsync("ReceiveMessage", message);

            return Ok();
        }

        private string GetChatGroupId(string userA, string userB)
        {
            return string.CompareOrdinal(userA, userB) < 0 ? $"{userA}-{userB}" : $"{userB}-{userA}";
        }
        
        [HttpGet("GetLatestConversation")]
        public async Task<IActionResult> GetLatestConversation(string userId)
        {
            var latestMessage = await _context.Messages
                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                .OrderByDescending(m => m.Timestamp)
                .FirstOrDefaultAsync();

            if (latestMessage == null)
            {
                return NotFound("No conversations found for this user.");
            }

            // Identify the other user in the conversation
            var contactId = latestMessage.SenderId == userId ? latestMessage.ReceiverId : latestMessage.SenderId;
            var contactUser = await _context.Users.FindAsync(contactId);

            if (contactUser == null)
            {
                return NotFound("The contact user was not found.");
            }

            var latestConversation = new ConversationDTO
            {
                UserId = contactUser.Id,
                UserName = contactUser.UserName,
                UserEmail = contactUser.Email,
                UserProfilePicture = contactUser.ProfilePictureUrl,
                LastMessageContent = latestMessage.Content,
                LastMessageTimestamp = latestMessage.Timestamp,
                LastMessageSenderId = latestMessage.SenderId
            };

            return Ok(latestConversation);
        }

    }
}