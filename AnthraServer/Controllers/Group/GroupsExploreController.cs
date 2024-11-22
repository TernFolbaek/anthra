// Controllers/GroupsExploreController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyBackendApp.Data;
using MyBackendApp.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace MyBackendApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GroupsExploreController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public GroupsExploreController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetGroups")]
        public async Task<IActionResult> GetGroups()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Get IDs of groups the user is already a member of
            var userGroupIds = await _context.GroupMembers
                .Where(gm => gm.UserId == currentUserId)
                .Select(gm => gm.GroupId)
                .ToListAsync();

            // Get IDs of groups the user has skipped
            var skippedGroupIds = await _context.SkippedGroups
                .Where(sg => sg.UserId == currentUserId)
                .Select(sg => sg.GroupId)
                .ToListAsync();

            // Combine IDs to exclude
            var excludedGroupIds = userGroupIds.Concat(skippedGroupIds).ToList();

            // Fetch public groups excluding the ones in excludedGroupIds
            var groups = await _context.Groups
                .AsNoTracking()
                .Where(g => g.isPublic && !excludedGroupIds.Contains(g.Id))
                .Select(g => new
                {
                    g.Id,
                    g.Name,
                    g.GroupDescription,
                    g.GroupMemberDesire,
                    Members = g.Members
                        .Where(m => m.IsAccepted)
                        .Select(m => new
                        {
                            m.UserId,
                            m.User.FirstName,
                            m.User.LastName,
                            m.User.ProfilePictureUrl
                        })
                        .ToList()
                })
                .ToListAsync();

            return Ok(groups);
        }

        [HttpPost("SkipGroup")]
        public async Task<IActionResult> SkipGroup([FromBody] SkipGroupModel model)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Check if the skip record already exists
            var existingSkip = await _context.SkippedGroups
                .FirstOrDefaultAsync(sg => sg.UserId == currentUserId && sg.GroupId == model.GroupIdToSkip);

            if (existingSkip != null)
            {
                return BadRequest("Group already skipped.");
            }

            var skippedGroup = new SkippedGroup
            {
                UserId = currentUserId,
                GroupId = model.GroupIdToSkip,
                SkippedAt = DateTime.UtcNow
            };

            _context.SkippedGroups.Add(skippedGroup);
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpPost("ApplyToGroup")]
        public async Task<IActionResult> ApplyToGroup([FromBody] ApplyToGroupModel model)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Check if the user is already a member or has applied before
            var existingMembership = await _context.GroupMembers
                .FirstOrDefaultAsync(gm => gm.GroupId == model.GroupId && gm.UserId == currentUserId);

            if (existingMembership != null)
            {
                return BadRequest("You have already applied or are a member of this group.");
            }

            // Add a new GroupMember record with IsAccepted = false
            var groupMember = new GroupMember
            {
                GroupId = model.GroupId,
                UserId = currentUserId,
                IsAccepted = false
            };
            _context.GroupMembers.Add(groupMember);

            // Optionally, send a notification to the group admin

            await _context.SaveChangesAsync();

            return Ok();
        }
    }

    public class SkipGroupModel
    {
        public int GroupIdToSkip { get; set; }
    }

    public class ApplyToGroupModel
    {
        public int GroupId { get; set; }
    }
}
