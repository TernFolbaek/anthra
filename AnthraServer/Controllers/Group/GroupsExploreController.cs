using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyBackendApp.Data;
using MyBackendApp.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace MyBackendApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GroupsExploreController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        private static readonly TimeSpan LOCKOUT_DURATION = TimeSpan.FromHours(24);

        public GroupsExploreController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetGroups")]
        public async Task<IActionResult> GetGroups()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userGroupIds = await _context.GroupMembers
                .Where(gm => gm.UserId == currentUserId && gm.IsAccepted)
                .Select(gm => gm.GroupId)
                .ToListAsync();

            //  - groups user has skipped
            var skippedGroupIds = await _context.SkippedGroups
                .Where(sg => sg.UserId == currentUserId)
                .Select(sg => sg.GroupId)
                .ToListAsync();

            //  - groups user has applied to
            var appliedGroupIds = await _context.GroupApplicationRequests
                .Where(gar => gar.ApplicantId == currentUserId && !gar.IsDeclined && !gar.IsAccepted)
                .Select(gar => gar.GroupId)
                .ToListAsync();
            
            var privateGroupIds = await _context.Groups
                .Where(g => !g.isPublic)
                .Select(g => g.Id)
                .ToListAsync();
            
            var excludedGroupIds = userGroupIds
                .Concat(skippedGroupIds)
                .Concat(appliedGroupIds)
                .Concat(privateGroupIds)
                .Distinct()
                .ToList();
            
            // 1) Load (if any) the existing group-explore session
            var session = await _context.GroupExploreSessions
                .Include(s => s.FetchedGroups)
                .FirstOrDefaultAsync(s => s.UserId == currentUserId);

            if (session != null)
            {
                var timeSinceLastFetch = DateTime.UtcNow - session.LastFetched;
                if (timeSinceLastFetch < LOCKOUT_DURATION)
                {
                    var remainingLockout = LOCKOUT_DURATION - timeSinceLastFetch;
                    var hoursLeft = (int)remainingLockout.TotalHours;
                    var minsLeft = remainingLockout.Minutes;

                    // Return existing fetched groups without calculating leftovers
                    var activeGroupIds = session.FetchedGroups
                        .Where(fg => fg.IsActive && !excludedGroupIds.Contains(fg.Id))
                        .Select(fg => fg.GroupId)
                        .ToList();

                    if (activeGroupIds.Any())
                    {
                        var activeGroups = await _context.Groups
                            .AsNoTracking()
                            .Where(g => activeGroupIds.Contains(g.Id))
                            .Select(g => new
                            {
                                g.Id,
                                g.Name,
                                g.GroupDescription,
                                g.GroupMemberDesire,
                                g.GroupPurpose,
                                Members = g.Members
                                    .Where(m => m.IsAccepted)
                                    .Select(m => new
                                    {
                                        m.UserId,
                                        m.User.FirstName,
                                        m.User.LastName,
                                        m.User.ProfilePictureUrl,
                                        m.User.Institution,
                                        m.User.Statuses,
                                        m.User.Location
                                    })
                                    .ToList()
                            })
                            .ToListAsync();

                        return Ok(new
                        {
                            mustWait = true,
                            groups = activeGroups,
                            message = $"You can explore new groups again in {hoursLeft}h {minsLeft}m"
                        });
                    }

                    return Ok(new
                    {
                        mustWait = true,
                        groups = Array.Empty<object>(),
                        message = $"You can explore new groups again in {hoursLeft}h {minsLeft}m"
                    });
                }
                else
                {
                    // Lockout period has expired; clear fetched groups
                    session.FetchedGroups.Clear();
                    session.LastFetched = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }
            else
            {
                // No existing session; create a new one
                session = new GroupExploreSession
                {
                    UserId = currentUserId,
                    LastFetched = DateTime.UtcNow,
                    FetchedGroups = new List<GroupExploreSessionGroup>()
                };
                _context.GroupExploreSessions.Add(session);
            }
            
            // Fetch up to 8 new groups
            var newGroups = await _context.Groups
                .AsNoTracking()
                .Where(g => !excludedGroupIds.Contains(g.Id))
                .Select(g => new
                {
                    g.Id,
                    g.Name,
                    g.GroupDescription,
                    g.GroupMemberDesire,
                    g.GroupPurpose,
                    Members = g.Members
                        .Where(m => m.IsAccepted)
                        .Select(m => new
                        {
                            m.UserId,
                            m.User.FirstName,
                            m.User.LastName,
                            m.User.ProfilePictureUrl,
                            m.User.Institution,
                            m.User.Statuses,
                            m.User.Location
                        })
                        .ToList()
                })
                .Take(8)
                .ToListAsync();

            if (newGroups.Any())
            {
                // Add new groups to the session
                foreach (var gObj in newGroups)
                {
                    session.FetchedGroups.Add(new GroupExploreSessionGroup
                    {
                        GroupId = gObj.Id,
                        IsActive = true
                    });
                }

                // Update the last fetched time
                session.LastFetched = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    mustWait = true,
                    groups = newGroups,
                    message = "Now we wait for the groups to respond 🎉!"
                });
            }
            else
            {
                session.LastFetched = DateTime.UtcNow.AddHours(-25);
                // No new groups found
                return Ok(new
                {
                    mustWait = false,
                    groups = new List<object>(),
                    message = "No groups found. Try again soon!"
                });
            }
        }

        [HttpPost("SkipGroup")]
        public async Task<IActionResult> SkipGroup([FromBody] SkipGroupModel model)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // 1) Add to SkippedGroups so future fetches exclude them
            var existingSkip = await _context.SkippedGroups
                .FirstOrDefaultAsync(sg => sg.UserId == currentUserId && sg.GroupId == model.GroupIdToSkip);

            if (existingSkip == null)
            {
                var skippedGroup = new SkippedGroup
                {
                    UserId = currentUserId,
                    GroupId = model.GroupIdToSkip,
                    SkippedAt = DateTime.UtcNow
                };
                _context.SkippedGroups.Add(skippedGroup);
            }

            // 2) Mark group as inactive in the session
            var session = await _context.GroupExploreSessions
                .Include(s => s.FetchedGroups)
                .FirstOrDefaultAsync(s => s.UserId == currentUserId);

            if (session != null)
            {
                var sessionGroup = session.FetchedGroups
                    .FirstOrDefault(fg => fg.GroupId == model.GroupIdToSkip && fg.IsActive);
                if (sessionGroup != null)
                {
                    sessionGroup.IsActive = false;
                }
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("ApplyToGroup")]
        [Authorize]
        public async Task<IActionResult> ApplyToGroup([FromBody] ApplyToGroupModel model)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var group = await _context.Groups.FindAsync(model.GroupId);
            if (group == null)
            {
                return NotFound("Group not found.");
            }

            // Check if user is already a member
            var existingMember = await _context.GroupMembers
                .FirstOrDefaultAsync(gm => gm.GroupId == model.GroupId && gm.UserId == currentUserId);
            if (existingMember != null)
            {
                return BadRequest("You are already a member of this group.");
            }

            // Check if there's an existing application
            var existingApplication = await _context.GroupApplicationRequests
                .FirstOrDefaultAsync(gar =>
                    gar.GroupId == model.GroupId &&
                    gar.ApplicantId == currentUserId &&
                    !gar.IsDeclined
                );
            if (existingApplication != null)
            {
                return BadRequest("You have already applied to this group.");
            }

            // Insert new application
            var applicationRequest = new GroupApplicationRequest
            {
                GroupId = model.GroupId,
                ApplicantId = currentUserId,
                AdminId = group.CreatorId,
                RequestedAt = DateTime.UtcNow,
                IsAccepted = false,
                IsDeclined = false
            };
            _context.GroupApplicationRequests.Add(applicationRequest);

            // Mark group as inactive in the session
            var session = await _context.GroupExploreSessions
                .Include(s => s.FetchedGroups)
                .FirstOrDefaultAsync(s => s.UserId == currentUserId);

            if (session != null)
            {
                var sessionGroup = session.FetchedGroups
                    .FirstOrDefault(fg => fg.GroupId == model.GroupId && fg.IsActive);
                if (sessionGroup != null)
                {
                    sessionGroup.IsActive = false;
                }
            }

            await _context.SaveChangesAsync();
            return Ok("Application submitted.");
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
