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

    public AccountController(UserManager<ApplicationUser> userManager, ApplicationDbContext context,
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
                // Retrieve the user before deletion to get the ProfilePictureUrl
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return NotFound("User not found.");
                }

                // Delete connections
                var connections = await _context.Connections
                    .Where(c => c.UserId1 == userId || c.UserId2 == userId)
                    .ToListAsync();
                _context.Connections.RemoveRange(connections);

                // Delete messages
                var messages = await _context.Messages
                    .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                    .ToListAsync();
                _context.Messages.RemoveRange(messages);

                // Remove from group memberships
                var groupMemberships = await _context.GroupMembers
                    .Where(gm => gm.UserId == userId)
                    .ToListAsync();
                _context.GroupMembers.RemoveRange(groupMemberships);

                // Handle groups created by the user
                var groupsCreatedByUser = await _context.Groups
                    .Where(g => g.CreatorId == userId)
                    .ToListAsync();
                _context.Groups.RemoveRange(groupsCreatedByUser);

                // Delete connection requests
                var connectionRequests = await _context.ConnectionRequests
                    .Where(cr => cr.SenderId == userId || cr.ReceiverId == userId)
                    .ToListAsync();
                _context.ConnectionRequests.RemoveRange(connectionRequests);

                // Delete profile picture from Azure Blob Storage if it exists
                if (!string.IsNullOrEmpty(user.ProfilePictureUrl))
                {
                    await DeleteProfilePictureFromAzure(user.ProfilePictureUrl);
                }

                // Delete the user account
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
            // Log the exception (you might want to use a logger here)
            _logger.LogError(ex, "Error deleting blob: {BlobUrl}", blobUrl);
            // Optionally, you can rethrow or handle the exception as needed
        }
    }
}
