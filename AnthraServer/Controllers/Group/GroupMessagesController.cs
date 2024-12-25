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
using Microsoft.AspNetCore.Http;
using System.IO;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models; 
using Microsoft.Extensions.Logging;

namespace MyBackendApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GroupMessagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IHubContext<NotificationHub> _notificationHub;
        
        private readonly string _storageConnectionString =
            "BlobEndpoint=https://anthra.blob.core.windows.net/;QueueEndpoint=https://anthra.queue.core.windows.net/;FileEndpoint=https://anthra.file.core.windows.net/;TableEndpoint=https://anthra.table.core.windows.net/;SharedAccessSignature=sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2026-10-01T16:15:49Z&st=2024-10-01T08:15:49Z&spr=https&sig=SHmifWmLLf50pO0nqEVnIBYTqRx0QHmJpS5iAiYXq%2F0%3D";

        private readonly string _groupMessagesContainerName = "group-messages";

        private readonly ILogger<GroupMessagesController> _logger;

        public GroupMessagesController(
            ApplicationDbContext context,
            IHubContext<ChatHub> hubContext,
            IHubContext<NotificationHub> notificationHub
        )
        {
            _context = context;
            _notificationHub = notificationHub;
            _hubContext = hubContext;
            // _logger = logger;
        }
        
        [HttpGet("GetGroupChatHistory")]
        public async Task<IActionResult> GetGroupChatHistory(int groupId)
        {
            var messages = await _context.GroupMessages
                .Include(m => m.Sender)
                .Include(m => m.Attachment)
                .Where(m => m.GroupId == groupId)
                .OrderBy(m => m.Timestamp)
                .Select(m => new
                {
                    m.Id,
                    m.Content,
                    m.Timestamp,
                    SenderId = m.SenderId,
                    SenderFirstName = m.Sender != null ? m.Sender.FirstName : "Deleted User",
                    SenderProfilePictureUrl = m.Sender != null ? m.Sender.ProfilePictureUrl : null,
                    Attachments = m.Attachment != null ? new[] {
                        new {
                            m.Attachment.Id,
                            m.Attachment.FileName,
                            m.Attachment.FileUrl
                        }
                    } : null
                })
                .ToListAsync();

            return Ok(messages);
        }

        [HttpPost("SendGroupMessage")]
        public async Task<IActionResult> SendGroupMessage([FromForm] SendGroupMessageModel model)
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

            // Handle file upload to Azure Blob Storage
            if (model.File != null && model.File.Length > 0)
            {
                // Save the file in a subfolder corresponding to the groupId
                var fileUrl = await SaveFileToAzureAsync(model.File, model.GroupId);
                
                var attachment = new Attachment
                {
                    FileName = model.File.FileName,
                    FileUrl = fileUrl
                };
                message.Attachment = attachment;
                _context.Attachments.Add(attachment);
            }

            _context.GroupMessages.Add(message);
            await _context.SaveChangesAsync();

            // Notify group members (excluding the sender)
            var sender = await _context.Users.FindAsync(message.SenderId);
            var groupMembers = await _context.GroupMembers
                .Where(gm => gm.GroupId == model.GroupId && gm.UserId != model.SenderId)
                .Select(gm => gm.UserId)
                .ToListAsync();

            foreach (var memberId in groupMembers)
            {
                // Check if there's an existing unread GroupMessage notification
                var existingNotification = await _context.Notifications
                    .FirstOrDefaultAsync(n =>
                        n.UserId == memberId &&
                        n.SenderId == message.SenderId &&
                        n.Type == "GroupMessage" &&
                        n.GroupId == model.GroupId &&
                        !n.IsRead);

                if (existingNotification == null)
                {
                    var notification = new Notification
                    {
                        UserId = memberId,
                        Type = "GroupMessage",
                        Content = $"{sender?.FirstName} sent a message in the group",
                        Timestamp = DateTime.UtcNow,
                        IsRead = false,
                        SenderId = sender?.Id,
                        SenderName = sender?.FirstName,
                        GroupId = model.GroupId,
                        MessageCount = 1
                    };

                    _context.Notifications.Add(notification);
                    await _context.SaveChangesAsync();

                    // Send notification via SignalR
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
                            notification.GroupId,
                            notification.MessageCount
                        });
                }
                else
                {
                    // Update existing notification
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
                            existingNotification.GroupId,
                            existingNotification.MessageCount
                        });
                }
            }

            // Send the message via SignalR to the group
            var groupName = $"Group_{model.GroupId}";
            await _hubContext.Clients.Group(groupName).SendAsync("ReceiveGroupMessage", new
            {
                message.Id,
                message.Content,
                message.Timestamp,
                SenderId = message.SenderId,
                SenderFirstName = sender?.FirstName,
                SenderProfilePictureUrl = sender?.ProfilePictureUrl,
                GroupId = message.GroupId,
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

        /// <summary>
        /// Saves the file to Azure Blob Storage under the container "group-messages" and
        /// a subfolder named after the groupId. For example: "groupId/guid.ext".
        /// Returns the public URL to the uploaded blob.
        /// </summary>
        private async Task<string> SaveFileToAzureAsync(IFormFile file, int groupId)
        {
            try
            {
                // Create the BlobServiceClient
                var blobServiceClient = new BlobServiceClient(_storageConnectionString);

                // Get the container client, create if it doesn't exist
                var containerClient = blobServiceClient.GetBlobContainerClient(_groupMessagesContainerName);
                await containerClient.CreateIfNotExistsAsync();

                // Generate a unique filename
                var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);

                // Construct the blob path "groupId/uniqueFileName"
                var blobPath = $"{groupId}/{uniqueFileName}";

                // Create the blob client
                var blobClient = containerClient.GetBlobClient(blobPath);

                // Upload file content
                using (var stream = file.OpenReadStream())
                {
                    await blobClient.UploadAsync(stream, new BlobUploadOptions
                    {
                        HttpHeaders = new BlobHttpHeaders { ContentType = file.ContentType }
                    });
                }

                // Return the full URL of the blob
                return blobClient.Uri.ToString();
            }
            catch (Exception ex)
            {
                // _logger.LogError(ex, "Error uploading file to Azure Blob Storage for group {GroupId}", groupId);
                throw; // or handle the error as you wish
            }
        }
    }
}
