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

namespace MyBackendApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class GroupsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IHubContext<ChatHub> _hubContext; // Add this


        public GroupsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, IHubContext<ChatHub> hubContext)
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

        // Create a new group and invite users
        [HttpPost("CreateGroup")]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupModel model)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

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
            
            // create chathub membership
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
                var invitationContent = $"{User.Identity.Name} invites you to join the group '{group.Name}'.";
                var message = new Message
                {
                    SenderId = currentUserId,
                    ReceiverId = userId,
                    Content = invitationContent,
                    Timestamp = System.DateTime.UtcNow,
                    GroupId = group.Id, // New property to link message to the group
                    IsGroupInvitation = true // New property to identify invitation messages
                };
                _context.Messages.Add(message);
            }

            await _context.SaveChangesAsync();

            return Ok(group.Id);
        }

        // Get groups the current user is in
        [HttpGet("GetUserGroups")]
        public async Task<IActionResult> GetUserGroups()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var groups = await _context.GroupMembers
                .Where(gm => gm.UserId == currentUserId && gm.IsAccepted)
                .Include(gm => gm.Group)
                .Select(gm => new
                {
                    gm.Group.Id,
                    gm.Group.Name,
                    gm.Group.CreatorId,
                    gm.Group.adminName
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
}
