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
            groupId = group.Id,
            groupName = group.Name,
            group.CreatorId,
            CreatorName = group.adminName,
            groupDescription = group.GroupDescription,
            groupMembersDesired = group.GroupMemberDesire,
            group.isPublic
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
            adminName = model.AdminName,
            GroupDescription = model.GroupDescription,
            GroupMemberDesire = model.GroupMemberDesire,
            isPublic = model.isPublic,
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

            var message = new Message
            {
                SenderId = currentUserId,
                ReceiverId = userId,
                Content = "",
                Timestamp = DateTime.UtcNow,
                GroupId = group.Id,
                GroupName = model.Name,
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
    
    [HttpGet("GetLatestGroupConversation")]
    public async Task<IActionResult> GetLatestGroupConversation(string userId)
    {
        var latestGroupMessage = await _context.GroupMessages
            .Where(m => m.SenderId == userId)
            .OrderByDescending(m => m.Timestamp)
            .FirstOrDefaultAsync();

        if (latestGroupMessage == null)
        {
            return NotFound("No group conversations found for this user.");
        }

        var latestGroupId = latestGroupMessage.GroupId;

        return Ok(new { groupId = latestGroupId });
    }
    
    [HttpGet("GetGroupInfo")]
    public async Task<IActionResult> GetGroupInfo(int groupId)
    {
        var group = await _context.Groups
            .Include(g => g.Members)
            .ThenInclude(gm => gm.User)
            .FirstOrDefaultAsync(g => g.Id == groupId);

        if (group == null)
        {
            return NotFound();
        }

        var members = group.Members
            .Where(m => m.IsAccepted)
            .Select(m => new
            {
                m.UserId,
                m.User.FirstName,
                m.User.LastName,
                m.User.ProfilePictureUrl
            })
            .ToList();

        var attachments = await _context.GroupMessages
            .Include(m => m.Attachment)
            .Where(m => m.GroupId == groupId && m.Attachment != null)
            .Select(m => new
            {
                m.Attachment.Id,
                m.Attachment.FileName,
                m.Attachment.FileUrl
            })
            .ToListAsync();

        var groupDescription = group.GroupDescription;
        var groupDesiredMembers = group.GroupMemberDesire;
        var isPublic = group.isPublic;
        return Ok(new
        {
            members,
            attachments,
            groupDescription,
            groupDesiredMembers,
            isPublic
        });
    }

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
    
    [HttpPost("UpdateGroup")]
    [Authorize]
    public async Task<IActionResult> UpdateGroup([FromBody] UpdateGroupModel model)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == model.GroupId);

        if (group == null)
        {
            return NotFound("Group not found.");
        }

        if (group.CreatorId != currentUserId)
        {
            return Forbid("Only the group creator can update the group.");
        }

        group.Name = model.Name;
        group.GroupDescription = model.Description;
        group.GroupMemberDesire = model.GroupMemberDesire;
        group.isPublic = model.isPublic;
        await _context.SaveChangesAsync();

        return Ok();
    }

}