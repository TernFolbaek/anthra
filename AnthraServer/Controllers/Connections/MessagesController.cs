using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MyBackendApp.Data;
using MyBackendApp.Hubs;
using MyBackendApp.Models;
using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using MyBackendApp.ViewModels;
using Newtonsoft.Json;

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
                    FirstName = g.Select(m =>m.SenderId == g.Key ? m.Sender.FirstName : m.Receiver.FirstName).FirstOrDefault(),
                    LastName = g.Select(m =>m.SenderId == g.Key ? m.Sender.LastName : m.Receiver.LastName).FirstOrDefault(),
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
    public async Task<IActionResult> GetChatHistory(string userId, string contactId, int pageSize = 20, string nextToken = null)
    {
        var query = _context.Messages
            .Include(m => m.Attachment)
            .Where(m =>
                (m.SenderId == userId && m.ReceiverId == contactId) ||
                (m.SenderId == contactId && m.ReceiverId == userId));

        if (!string.IsNullOrEmpty(nextToken))
        {
            try
            {
                // Decode the nextToken from base64
                var decodedBytes = Convert.FromBase64String(nextToken);
                var decodedString = Encoding.UTF8.GetString(decodedBytes);

                // Deserialize the token JSON
                var token = JsonConvert.DeserializeObject<NextToken>(decodedString);

                if (token != null)
                {
                    // Fetch messages before the lastTimestamp and lastId
                    query = query.Where(m => m.Timestamp < token.Timestamp || (m.Timestamp == token.Timestamp && m.Id < token.Id));
                }
                else
                {
                    return BadRequest("Invalid nextToken.");
                }
            }
            catch (FormatException)
            {
                return BadRequest("Invalid nextToken format.");
            }
            catch (JsonException)
            {
                return BadRequest("Invalid nextToken content.");
            }
        }

        // Order by descending to get latest messages first
        query = query.OrderByDescending(m => m.Timestamp).ThenByDescending(m => m.Id);

        var fetchedMessages = await query
            .Take(pageSize)
            .Select(m => new
            {
                m.Id,
                m.SenderId,
                m.ReceiverId,
                m.Content,
                m.Timestamp,
                m.IsGroupInvitation,
                m.IsReferralCard,
                m.GroupId,
                m.GroupName,
                Attachments = m.Attachment != null ? new[] {
                    new {
                        m.Attachment.Id,
                        m.Attachment.FileName,
                        m.Attachment.FileUrl
                    }
                } : null
            })
            .ToListAsync();

        // Determine if there's a next page
        string newNextToken = null;
        if (fetchedMessages.Count == pageSize)
        {
            var lastMessage = fetchedMessages.Last();
            var tokenObject = new NextToken
            {
                Timestamp = lastMessage.Timestamp,
                Id = lastMessage.Id
            };
            var tokenJson = JsonConvert.SerializeObject(tokenObject);
            newNextToken = Convert.ToBase64String(Encoding.UTF8.GetBytes(tokenJson));
        }

        // Reverse the list to have chronological order
        var messages = fetchedMessages
            .OrderBy(m => m.Timestamp)
            .ThenBy(m => m.Id)
            .ToList();

        return Ok(new
        {
            messages,
            nextToken = newNextToken
        });
    }


    public class NextToken
    {
        public DateTime Timestamp { get; set; }
        public int Id { get; set; }
    }



    [HttpPost("SendMessage")]
public async Task<IActionResult> SendMessage([FromForm] SendMessageModel model)
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
        Timestamp = DateTime.UtcNow,
        IsReferralCard = model.IsReferralCard
    };

    // Handle file upload
    if (model.File != null && model.File.Length > 0)
    {
        var attachment = new Attachment
        {
            FileName = model.File.FileName,
            FileUrl = await SaveFileAsync(model.File),
            Message = message
        };
        _context.Attachments.Add(attachment);
        message.Attachment = attachment;
    }

    _context.Messages.Add(message);
    await _context.SaveChangesAsync();

    var sender = await _context.Users.FindAsync(message.SenderId);

    // **Check for existing unread notification**
    var existingNotification = await _context.Notifications
        .FirstOrDefaultAsync(n =>
            n.UserId == message.ReceiverId &&
            n.SenderId == message.SenderId &&
            n.Type == "Message" &&
            !n.IsRead);

    if (existingNotification == null)
    {
        var notification = new Notification
        {
            UserId = message.ReceiverId,
            Type = "Message",
            Content = $"{sender.FirstName} sent you a message",
            Timestamp = DateTime.UtcNow,
            IsRead = false,
            SenderId = sender.Id,
            SenderName = sender.FirstName,
            MessageCount = 1
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
                notification.SenderName,
                notification.MessageCount
            });
    }
    else
    {
        existingNotification.Timestamp = DateTime.UtcNow;
        existingNotification.MessageCount += 1;
        await _context.SaveChangesAsync();

        await _notificationHub.Clients.Group($"User_{existingNotification.UserId}")
            .SendAsync("UpdateNotification", new
            {
                existingNotification.Id,
                existingNotification.Type,
                existingNotification.Content,
                existingNotification.Timestamp,
                existingNotification.IsRead,
                existingNotification.SenderId,
                existingNotification.SenderName,
                existingNotification.MessageCount
            });
    }

    // Send message via SignalR
    var groupId = GetChatGroupId(message.SenderId, message.ReceiverId);
    await _hubContext.Clients.Group(groupId).SendAsync("ReceiveMessage", new
    {
        message.Id,
        message.SenderId,
        message.ReceiverId,
        message.Content,
        message.Timestamp,
        message.IsGroupInvitation,
        message.IsReferralCard,
        message.GroupId,
        Attachments = message.Attachment != null ? new[] {
            new {
                message.Attachment.Id,
                message.Attachment.FileName,
                message.Attachment.FileUrl
            }
        } : null
    });

    return Ok();
}


        private async Task<string> SaveFileAsync(IFormFile file)
        {
            var uploadsFolder = Path.Combine("wwwroot", "Uploads", "Messages");
            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            Directory.CreateDirectory(uploadsFolder);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return the relative file path
            return Path.Combine("Uploads", "Messages", uniqueFileName).Replace("\\", "/");
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