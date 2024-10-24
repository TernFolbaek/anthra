// Controllers/GroupsController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MyBackendApp.Data;
using MyBackendApp.Models;
using MyBackendApp.ViewModels;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MyBackendApp.Hubs;

namespace MyBackendApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GroupsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IHubContext<ChatHub> _hubContext; // Add this


    public GroupsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager,
        IHubContext<ChatHub> hubContext)
    {
        _context = context;
        _userManager = userManager;
        _hubContext = hubContext;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetGroupById(int id)
    {
        var group = await _context.Groups
            .Include(g => g.Creator)
            .FirstOrDefaultAsync(g => g.Id == id);

        if (group == null)
        {
            return NotFound();
        }

        var groupDetails = new
        {
            group.Id,
            group.Name,
            CreatorId = group.CreatorId,
            CreatorName = group.adminName,
        };

        return Ok(groupDetails);
    }

    // Include this method in your controller if not already present
    private string GetChatGroupId(string userA, string userB)
    {
        return string.CompareOrdinal(userA, userB) < 0 ? $"{userA}-{userB}" : $"{userB}-{userA}";
    }

    [HttpPost("CreateGroup")]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupModel model)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var currentUserName = User.Identity.Name;

        if (string.IsNullOrEmpty(model.Name))
        {
            return BadRequest("Group name is required.");
        }

        var group = new Group
        {
            Name = model.Name,
            CreatorId = currentUserId,
            adminName = model.AdminName
        };

        _context.Groups.Add(group);
        await _context.SaveChangesAsync();

        // Add the creator as an accepted member
        var creatorMembership = new GroupMember
        {
            GroupId = group.Id,
            UserId = currentUserId,
            IsAccepted = true
        };
        _context.GroupMembers.Add(creatorMembership);

        // Invite other users
        foreach (var userId in model.InvitedUserIds)
        {
            var groupMember = new GroupMember
            {
                GroupId = group.Id,
                UserId = userId,
                IsAccepted = false
            };
            _context.GroupMembers.Add(groupMember);

            // Send invitation message
            var invitationContent = $"{currentUserName} invites you to join the group '{group.Name}'";
            var message = new Message
            {
                SenderId = currentUserId,
                ReceiverId = userId,
                Content = invitationContent,
                Timestamp = System.DateTime.UtcNow,
                GroupId = group.Id,
                IsGroupInvitation = true
            };
            _context.Messages.Add(message);

            // Send the invitation message via SignalR
            var chatGroupId = GetChatGroupId(currentUserId, userId);
            await _hubContext.Clients.Group(chatGroupId).SendAsync("ReceiveMessage", message);
        }

        await _context.SaveChangesAsync();

        return Ok(group.Id);
    }


// Controllers/GroupsController.cs
    [HttpGet("GetUserGroups")]
    public async Task<IActionResult> GetUserGroups()
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var groups = await _context.Groups
            .Include(g => g.Members)
            .ThenInclude(gm => gm.User)
            .Where(g => g.Members.Any(gm => gm.UserId == currentUserId && gm.IsAccepted))
            .Select(g => new
            {
                g.Id,
                g.Name,
                CreatorId = g.CreatorId,
                g.adminName,
                Members = g.Members.Select(m => new
                {
                    UserId = m.UserId,
                    ProfilePictureUrl = m.User.ProfilePictureUrl
                }).ToList()
            })
            .ToListAsync();

        return Ok(groups);
    }


    // Accept or decline group invitation
    [HttpPost("RespondToInvitation")]
    public async Task<IActionResult> RespondToInvitation([FromBody] RespondToInvitationModel model)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var groupMember = await _context.GroupMembers
            .FirstOrDefaultAsync(gm => gm.GroupId == model.GroupId && gm.UserId == currentUserId);

        if (groupMember == null)
        {
            return NotFound("Invitation not found.");
        }

        if (model.Accept)
        {
            groupMember.IsAccepted = true;
            // Optionally, send a message to the group creator or members
        }
        else
        {
            _context.GroupMembers.Remove(groupMember);
        }

        // Remove the invitation message
        var invitationMessages = await _context.Messages
            .Where(m => m.ReceiverId == currentUserId && m.IsGroupInvitation && m.GroupId == model.GroupId)
            .ToListAsync();

        _context.Messages.RemoveRange(invitationMessages);

        await _context.SaveChangesAsync();

        return Ok();
    }
}