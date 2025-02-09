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
using System.Security.Claims;
using System.Text;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models; 
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

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
        public async Task<IActionResult> GetGroupChatHistory(int groupId, int pageSize = 30, string nextToken = null)
        {
            var query = _context.GroupMessages
                .Include(m => m.Sender)
                .Include(m => m.Attachment)
                .Where(m => m.GroupId == groupId);

            // If nextToken is provided, decode it to know what "page" to fetch:
            if (!string.IsNullOrEmpty(nextToken))
            {
                try
                {
                    var decodedBytes = Convert.FromBase64String(nextToken);
                    var decodedString = Encoding.UTF8.GetString(decodedBytes);
                    var token = JsonConvert.DeserializeObject<MessagesController.NextToken>(decodedString);

                    if (token != null)
                    {
                        // Return messages strictly older than the last one we had
                        query = query.Where(m =>
                            m.Timestamp < token.Timestamp ||
                            (m.Timestamp == token.Timestamp && m.Id < token.Id));
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

            query = query.OrderByDescending(m => m.Timestamp)
                .ThenByDescending(m => m.Id);

            var fetchedMessages = await query
                .Take(pageSize)
                .Select(m => new
                {
                    m.Id,
                    m.Content,
                    m.Timestamp,
                    SenderId = m.SenderId,
                    SenderFirstName = m.Sender != null ? m.Sender.FirstName : "Deleted User",
                    SenderProfilePictureUrl = m.Sender != null ? m.Sender.ProfilePictureUrl : null,
                    GroupId = m.GroupId,
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

            // Determine if more data might remain
            string newNextToken = null;
            if (fetchedMessages.Count == pageSize)
            {
                // The last fetched message (which is oldest in this chunk)
                var lastMessage = fetchedMessages.Last();
                var tokenObject = new MessagesController.NextToken
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
         [HttpDelete("DeleteMessage")]
        public async Task<IActionResult> DeleteMessage([FromBody] DeleteGroupMessageRequest request)
        {
            if (request == null || request.MessageId <= 0)
            {
                return BadRequest("Invalid messageId.");
            }

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);


            var message = await _context.GroupMessages
                .Include(m => m.Attachment)
                .FirstOrDefaultAsync(m => m.Id == request.MessageId);

            if (message == null)
            {
                return NotFound("Message does not exist or was already deleted.");
            }

            var group = await _context.Groups
                .Include(g => g.Creator)
                .FirstOrDefaultAsync(g => g.Id == message.GroupId);

            bool isSender = (message.SenderId == currentUserId);
            bool isGroupCreator = (group?.CreatorId == currentUserId);
            

            // If there's an attachment, decide if you want to delete it from Blob Storage
            if (message.Attachment != null)
            {
                try
                {
                    var blobServiceClient = new BlobServiceClient(_storageConnectionString);
                    var containerClient = blobServiceClient.GetBlobContainerClient(_groupMessagesContainerName);

                    // The path is typically something like "groupId/fileName" or "groupId/guid.ext"
                    // If you stored it that way, parse it out:
                    // For example, if FileUrl is "https://.../group-messages/123/filename.jpg"
                    // then the relative path is "123/filename.jpg"

                    var containerUri = containerClient.Uri.ToString();
                    // e.g. "https://anthra.blob.core.windows.net/group-messages"
                    // We want to get what's after this containerUri + "/"

                    var blobUrl = message.Attachment.FileUrl;
                    if (blobUrl.StartsWith(containerUri))
                    {
                        var relativePath = blobUrl.Substring(containerUri.Length + 1);
                        var blobClient = containerClient.GetBlobClient(relativePath);
                        await blobClient.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots);
                    }

                    // Remove from DB
                    _context.Attachments.Remove(message.Attachment);
                }
                catch (Exception ex)
                {
                    // log the error if needed
                }
            }

            _context.GroupMessages.Remove(message);
            await _context.SaveChangesAsync();

            // If you want to notify group members in real time:
            // E.g., let them remove the message from their UI
            var groupName = $"Group_{message.GroupId}";
            await _hubContext.Clients.Group(groupName).SendAsync("GroupMessageDeleted", new
            {
                messageId = message.Id
            });

            return Ok(new { success = true, message = "Message deleted successfully." });
        }
    

    public class DeleteGroupMessageRequest
    {
        public int MessageId { get; set; }
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
