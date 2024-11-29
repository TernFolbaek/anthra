using System.Security.Claims;
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

                // Delete the user account
                var user = await _userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    var result = await _userManager.DeleteAsync(user);
                    if (!result.Succeeded)
                    {
                        return BadRequest("Failed to delete user account.");
                    }
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
}