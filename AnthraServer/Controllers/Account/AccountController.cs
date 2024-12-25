using System.Security.Claims;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyBackendApp.Data;
using MyBackendApp.Models;

namespace AnthraBackend.Controllers.Account;

[ApiController]
[Route("api/[controller]")]
public class AccountController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AccountController> _logger;

    private readonly string _storageConnectionString =
        "BlobEndpoint=https://anthra.blob.core.windows.net/;QueueEndpoint=https://anthra.queue.core.windows.net/;FileEndpoint=https://anthra.file.core.windows.net/;TableEndpoint=https://anthra.table.core.windows.net/;SharedAccessSignature=sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2026-10-01T16:15:49Z&st=2024-10-01T08:15:49Z&spr=https&sig=SHmifWmLLf50pO0nqEVnIBYTqRx0QHmJpS5iAiYXq%2F0%3D";

    private readonly string _containerName = "profile-pictures";

    private readonly string _directMessagesContainer = "direct-messages";

    public AccountController(
        UserManager<ApplicationUser> userManager, 
        ApplicationDbContext context,
        ILogger<AccountController> logger)
    {
        _userManager = userManager;
        _context = context;
        _logger = logger;
    }

    [HttpDelete("DeleteAccount")]
    [Authorize]
    public async Task<IActionResult> DeleteAccount()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            return Unauthorized();
        }

        // Start a transaction to ensure atomicity
        using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            try
            {
                // Retrieve the user before deletion
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return NotFound("User not found.");
                }

                // 1) Delete connections
                var connections = await _context.Connections
                    .Where(c => c.UserId1 == userId || c.UserId2 == userId)
                    .ToListAsync();
                _context.Connections.RemoveRange(connections);

                // 2) Delete messages
                //    (We'll also delete the attachments from Azure below.)
                var messages = await _context.Messages
                    .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                    .ToListAsync();
                _context.Messages.RemoveRange(messages);

                // 3) Remove from group memberships
                var groupMemberships = await _context.GroupMembers
                    .Where(gm => gm.UserId == userId)
                    .ToListAsync();
                _context.GroupMembers.RemoveRange(groupMemberships);

                // 4) Handle groups created by the user
                var groupsCreatedByUser = await _context.Groups
                    .Where(g => g.CreatorId == userId)
                    .ToListAsync();
                _context.Groups.RemoveRange(groupsCreatedByUser);

                // 5) Delete connection requests
                var connectionRequests = await _context.ConnectionRequests
                    .Where(cr => cr.SenderId == userId || cr.ReceiverId == userId)
                    .ToListAsync();
                _context.ConnectionRequests.RemoveRange(connectionRequests);

                // 6) Delete profile picture from Azure Blob Storage if it exists
                if (!string.IsNullOrEmpty(user.ProfilePictureUrl))
                {
                    await DeleteProfilePictureFromAzure(user.ProfilePictureUrl);
                }

                // 7) Delete all direct-message attachments from Azure subfolders 
                //    that contain this userId
                await DeleteAttachmentsFromAzure(userId);

                // 8) Finally, delete the user account
                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                {
                    return BadRequest("Failed to delete user account.");
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok("Account deleted successfully.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error deleting account for user {UserId}", userId);
                return StatusCode(500, "An error occurred while deleting your account.");
            }
        }
    }

    private async Task DeleteProfilePictureFromAzure(string blobUrl)
    {
        try
        {
            // Parse the blob name from the URL
            Uri uri = new Uri(blobUrl);
            string blobName = Path.GetFileName(uri.LocalPath);

            // Create a BlobServiceClient
            BlobServiceClient blobServiceClient = new BlobServiceClient(_storageConnectionString);

            // Get the container client
            BlobContainerClient containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

            // Get the blob client
            BlobClient blobClient = containerClient.GetBlobClient(blobName);

            // Delete the blob if it exists
            await blobClient.DeleteIfExistsAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting blob: {BlobUrl}", blobUrl);
        }
    }

    /// <summary>
    /// Finds all subfolders (e.g. "userA-userB") in the direct-messages container
    /// that include the given userId, and deletes all blobs under them.
    /// </summary>
    private async Task DeleteAttachmentsFromAzure(string userId)
    {
        try
        {
            var blobServiceClient = new BlobServiceClient(_storageConnectionString);
            var containerClient = blobServiceClient.GetBlobContainerClient(_directMessagesContainer);

            // Ensure container exists, otherwise there's nothing to delete
            if (!await containerClient.ExistsAsync())
            {
                return;
            }

            // List all blobs in the container
            // Each blob name typically looks like: "userA-userB/guid-filename.ext"
            // We'll delete the blob if its subfolder (split by '/') includes userId.

            await foreach (var blobItem in containerClient.GetBlobsAsync())
            {
                // Example blobItem.Name = "userA-userB/12345abc.jpg"
                var segments = blobItem.Name.Split('/');
                if (segments.Length >= 2)
                {
                    // subfolder is the first part: "userA-userB"
                    // we can check if 'userId' is in that subfolder
                    var subfolder1 = segments[0]; // e.g. "userA-userB"'
                    var subfolder2 = segments[1];

                    // subfolder might be "userA-userB"
                    // We'll split on '-' and see if userId is either userA or userB
                    var subfolderParts = subfolder1.Split('-'); 
                    if (subfolderParts.Contains(userId))
                    {
                        // Delete this blob
                        var blobClient = containerClient.GetBlobClient(blobItem.Name);
                        await blobClient.DeleteIfExistsAsync();
                    }
                    var subfolderParts2 = subfolder2.Split('-'); 

                    if (subfolderParts2.Contains(userId))
                    {
                        // Delete this blob
                        var blobClient = containerClient.GetBlobClient(blobItem.Name);
                        await blobClient.DeleteIfExistsAsync();
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting attachments in subfolders for user {UserId}", userId);
            // Optionally rethrow or handle as needed
        }
    }
}
