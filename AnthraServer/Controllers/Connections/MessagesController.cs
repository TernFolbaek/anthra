using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MyBackendApp.Data;
using MyBackendApp.Hubs;
using MyBackendApp.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using MyBackendApp.ViewModels;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Http;    // For IFormFile
using Azure.Storage.Blobs;        // Azure Blob storage namespaces
using Azure.Storage.Blobs.Models; // For BlobUploadOptions, BlobHttpHeaders
using Microsoft.Extensions.Logging;
using System.IO;                  // For Path, FileStream

namespace MyBackendApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IHubContext<NotificationHub> _notificationHub;
        private readonly ILogger<MessagesController> _logger;

        // 1) Container name for direct message attachments
        private readonly string _storageConnectionString =
            "BlobEndpoint=https://anthra.blob.core.windows.net/;QueueEndpoint=https://anthra.queue.core.windows.net/;FileEndpoint=https://anthra.file.core.windows.net/;TableEndpoint=https://anthra.table.core.windows.net/;SharedAccessSignature=sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2026-10-01T16:15:49Z&st=2024-10-01T08:15:49Z&spr=https&sig=SHmifWmLLf50pO0nqEVnIBYTqRx0QHmJpS5iAiYXq%2F0%3D";
        private readonly string _attachmentsContainerName = "direct-messages";

        public MessagesController(
            ApplicationDbContext context,
            IHubContext<ChatHub> hubContext,
            IHubContext<NotificationHub> notificationHub,
            ILogger<MessagesController> logger
        )
        {
            _context = context;
            _hubContext = hubContext;
            _notificationHub = notificationHub;
            _logger = logger;
        }

        // ------------------------------------------
        // GET CONVERSATIONS
        // ------------------------------------------
        [HttpGet("GetConversations")]
        public async Task<IActionResult> GetConversations(string userId)
        {
            // Query all messages where userId is sender or receiver
            var messagesQuery = _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => m.SenderId == userId || m.ReceiverId == userId);

            // Group by conversation partner
            var conversations = await messagesQuery
                .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                .Select(g => new ConversationDTO
                {
                    UserId = g.Key,
                    UserName = g.Select(m => m.SenderId == g.Key 
                        ? m.Sender.UserName 
                        : m.Receiver.UserName).FirstOrDefault(),
                    FirstName = g.Select(m => m.SenderId == g.Key 
                        ? m.Sender.FirstName 
                        : m.Receiver.FirstName).FirstOrDefault(),
                    LastName = g.Select(m => m.SenderId == g.Key 
                        ? m.Sender.LastName 
                        : m.Receiver.LastName).FirstOrDefault(),
                    UserEmail = g.Select(m => m.SenderId == g.Key 
                        ? m.Sender.Email 
                        : m.Receiver.Email).FirstOrDefault(),
                    UserProfilePicture = g.Select(m => m.SenderId == g.Key 
                        ? m.Sender.ProfilePictureUrl 
                        : m.Receiver.ProfilePictureUrl).FirstOrDefault(),

                    // Safely coalesce content so it never returns null to the front-end
                    LastMessageContent = g.OrderByDescending(m => m.Timestamp)
                        .Select(m => m.Content ?? "")
                        .FirstOrDefault(),

                    LastMessageTimestamp = g.Max(m => m.Timestamp),
                    LastMessageSenderId = g.OrderByDescending(m => m.Timestamp)
                        .Select(m => m.SenderId)
                        .FirstOrDefault(),
                    ActionType = g.OrderByDescending(m => m.Timestamp)
                        .Select(m => m.ActionType)
                        .FirstOrDefault(),
                    InvitationStatus = g.OrderByDescending(m => m.Timestamp)
                        .Select(m => m.InvitationStatus)
                        .FirstOrDefault(),
                })
                .ToListAsync();

            return Ok(conversations);
        }

        // ------------------------------------------
        // GET CHAT HISTORY
        // ------------------------------------------
        [HttpGet("GetChatHistory")]
        public async Task<IActionResult> GetChatHistory(string userId, string contactId, int pageSize = 20, string nextToken = null)
        {
            var query = _context.Messages
                .Include(m => m.Attachment)
                .Where(m =>
                    (m.SenderId == userId && m.ReceiverId == contactId) ||
                    (m.SenderId == contactId && m.ReceiverId == userId));

            // handle pagination
            if (!string.IsNullOrEmpty(nextToken))
            {
                try
                {
                    // Decode the nextToken from base64
                    var decodedBytes = Convert.FromBase64String(nextToken);
                    var decodedString = Encoding.UTF8.GetString(decodedBytes);
                    var token = JsonConvert.DeserializeObject<NextToken>(decodedString);

                    if (token != null)
                    {
                        // Fetch messages before the lastTimestamp/lastId
                        query = query.Where(m => m.Timestamp < token.Timestamp
                            || (m.Timestamp == token.Timestamp && m.Id < token.Id));
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

            // Order by descending (latest first)
            query = query.OrderByDescending(m => m.Timestamp).ThenByDescending(m => m.Id);

            var fetchedMessages = await query
                .Take(pageSize)
                .Select(m => new
                {
                    m.Id,
                    m.SenderId,
                    m.ReceiverId,
                    // Coalesce content to "" so the front-end won't get null
                    Content = m.Content ?? "",
                    m.Timestamp,
                    m.IsGroupInvitation,
                    m.IsReferralCard,
                    m.GroupId,
                    m.GroupName,
                    m.InvitationStatus,
                    m.ActionType,
                    Attachments = m.Attachment != null
                        ? new[]
                            {
                                new
                                {
                                    m.Attachment.Id,
                                    m.Attachment.FileName,
                                    m.Attachment.FileUrl
                                }
                            }
                        : null
                })
                .ToListAsync();

            // Check if there's a next page
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

            // Reverse back to chronological order
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

        // ------------------------------------------
        // SEND MESSAGE
        // ------------------------------------------
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
                Content = model.Content, // might be null
                Timestamp = DateTime.UtcNow,
                IsReferralCard = model.IsReferralCard
            };

            _context.Messages.Add(message);

            // If there's a file, upload it to Azure
            if (model.File != null && model.File.Length > 0)
            {
                var chatGroupId = GetChatGroupId(message.SenderId, message.ReceiverId);
                
                var attachment = new Attachment
                {
                    FileName = model.File.FileName,
                    FileUrl = await SaveFileAsync(model.File, chatGroupId),
                    Message = message
                };
                _context.Attachments.Add(attachment);
                message.Attachment = attachment;
            }

            await _context.SaveChangesAsync();

            var sender = await _context.Users.FindAsync(message.SenderId);

            // Check for existing unread notification
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

            // Broadcast the message via SignalR
            var groupId = GetChatGroupId(message.SenderId, message.ReceiverId);
            await _hubContext.Clients.Group(groupId).SendAsync("ReceiveMessage", new
            {
                message.Id,
                message.SenderId,
                message.ReceiverId,
                // Coalesce content to empty string for the broadcast
                Content = message.Content ?? "",
                message.Timestamp,
                message.IsGroupInvitation,
                message.IsReferralCard,
                message.GroupId,
                Attachments = message.Attachment != null
                    ? new[]
                        {
                            new
                            {
                                message.Attachment.Id,
                                message.Attachment.FileName,
                                message.Attachment.FileUrl
                            }
                        }
                    : null
            });

            return Ok();
        }

        /// <summary>
        /// Saves the file to Azure under a subfolder like "userA-userB".
        /// </summary>
        private async Task<string> SaveFileAsync(IFormFile file, string subFolderName)
        {
            try
            {
                // Create the BlobServiceClient
                BlobServiceClient blobServiceClient = new BlobServiceClient(_storageConnectionString);

                // Get the container (creates if not exists)
                BlobContainerClient containerClient = blobServiceClient.GetBlobContainerClient(_attachmentsContainerName);
                await containerClient.CreateIfNotExistsAsync();

                // Generate a unique file name
                var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);

                // The blob path: "userA-userB/uniqueFileName.ext"
                var blobPath = $"{subFolderName}/{uniqueFileName}";

                // Get a reference to the blob
                BlobClient blobClient = containerClient.GetBlobClient(blobPath);

                // Upload the file
                using (var stream = file.OpenReadStream())
                {
                    await blobClient.UploadAsync(stream, new BlobUploadOptions
                    {
                        HttpHeaders = new BlobHttpHeaders { ContentType = file.ContentType }
                    });
                }

                // Return the full blob URL
                return blobClient.Uri.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file to Azure Blob Storage.");
                throw;
            }
        }

        // ------------------------------------------
        // DELETE MESSAGE
        // ------------------------------------------
        [HttpDelete("DeleteMessage")]
        public async Task<IActionResult> DeleteMessage([FromBody] DeleteMessageRequest request)
        {
            if (request == null || request.MessageId <= 0)
            {
                return BadRequest("Invalid message ID.");
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var message = await _context.Messages
                .Include(m => m.Attachment)
                .FirstOrDefaultAsync(m => m.Id == request.MessageId);
            
            if (message == null)
            {
                return NotFound("Message not found.");
            }

            // Only the sender or receiver can delete the message
            if (message.SenderId != userId && message.ReceiverId != userId)
            {
                return Forbid();
            }

            // Delete from Azure if there's an attachment
            if (message.Attachment != null && !string.IsNullOrEmpty(message.Attachment.FileUrl))
            {
                await DeleteAttachmentFromAzure(message.Attachment.FileUrl);
                _context.Attachments.Remove(message.Attachment);
            }

            _context.Messages.Remove(message);
            await _context.SaveChangesAsync();

            // Notify the other user that the message was deleted
            var otherUserId = message.SenderId == userId ? message.ReceiverId : message.SenderId;
            var groupId = GetChatGroupId(userId, otherUserId);
            await _hubContext.Clients.Group(groupId).SendAsync("MessageDeleted", new { messageId = message.Id });

            return Ok(new { message = "Message deleted successfully." });
        }

        /// <summary>
        /// Deletes a blob from Azure Blob Storage given its URL.
        /// </summary>
        private async Task DeleteAttachmentFromAzure(string blobUrl)
        {
            try
            {
                var uri = new Uri(blobUrl);
                // The blob name is the path after the container name, e.g. "userA-userB/guid.jpg"
                var blobName = uri.LocalPath.TrimStart('/'); 

                var blobServiceClient = new BlobServiceClient(_storageConnectionString);
                var containerClient = blobServiceClient.GetBlobContainerClient(_attachmentsContainerName);

                var blobClient = containerClient.GetBlobClient(blobName);
                await blobClient.DeleteIfExistsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting blob: {BlobUrl}", blobUrl);
            }
        }

        public class DeleteMessageRequest
        {
            public int MessageId { get; set; }
        }

        // ------------------------------------------
        // UPDATE MESSAGE
        // ------------------------------------------
        [HttpPatch("UpdateMessage")]
        public async Task<IActionResult> UpdateMessage([FromBody] UpdateMessageRequest request)
        {
            if (request == null || request.MessageId <= 0)
            {
                return BadRequest("Invalid request data.");
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var message = await _context.Messages.FindAsync(request.MessageId);
            if (message == null)
            {
                return NotFound("Message not found.");
            }

            // Only the receiver can update invitation status
            if (message.ReceiverId != userId)
            {
                return Forbid("You are not authorized to update this message.");
            }

            // Update fields
            message.InvitationStatus = true;
            message.ActionType = request.ActionType;

            await _context.SaveChangesAsync();

            // Optionally notify the sender that it was updated
            return Ok(new { message = "Message updated successfully." });
        }

        /// <summary>
        /// Generate a consistent subfolder name (userA-userB) in alphabetical order.
        /// </summary>
        private string GetChatGroupId(string userA, string userB)
        {
            return string.CompareOrdinal(userA, userB) < 0 ? $"{userA}-{userB}" : $"{userB}-{userA}";
        }

        // ------------------------------------------
        // GET LATEST CONVERSATION
        // ------------------------------------------
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

            // Identify the other user
            var contactId = (latestMessage.SenderId == userId) 
                ? latestMessage.ReceiverId 
                : latestMessage.SenderId;
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
                // Coalesce content in case it's null
                LastMessageContent = latestMessage.Content ?? "",
                LastMessageTimestamp = latestMessage.Timestamp,
                LastMessageSenderId = latestMessage.SenderId
            };

            return Ok(latestConversation);
        }
        
        // Add this inside MessagesController

        /// <summary>
        /// Returns all attachments exchanged between two users (userA and userB).
        /// Example usage: GET /api/Messages/GetAttachmentsForUsers?userA=123&userB=456
        /// </summary>
        [HttpGet("GetAttachmentsForUsers")]
        public async Task<IActionResult> GetAttachmentsForUsers(string userA, string userB)
        {
            if (string.IsNullOrEmpty(userA) || string.IsNullOrEmpty(userB))
            {
                return BadRequest("Both userA and userB are required.");
            }

            // Retrieve all messages involving these two users
            var attachments = await _context.Messages
                .Include(m => m.Attachment)
                .Where(m =>
                    (m.SenderId == userA && m.ReceiverId == userB)
                    || (m.SenderId == userB && m.ReceiverId == userA)
                )
                // Only messages that actually have an attachment
                .Where(m => m.Attachment != null)
                // Order by newest message first (optional)
                .OrderByDescending(m => m.Timestamp)
                // Project into a DTO
                .Select(m => new AttachmentDTO
                {
                    Id = m.Attachment.Id,
                    FileName = m.Attachment.FileName,
                    FileUrl = m.Attachment.FileUrl
                })
                .ToListAsync();

            return Ok(attachments);
        }
        
        public class AttachmentDTO
        {
            public int Id { get; set; }
            public string FileName { get; set; }
            public string FileUrl { get; set; }
        }

    }
    
    
    

}
