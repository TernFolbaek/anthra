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

            // 1) Check if there's an existing GroupExploreSession
            var session = await _context.GroupExploreSessions
                .Include(s => s.FetchedGroups)
                .FirstOrDefaultAsync(s => s.UserId == currentUserId);

            // If we have an existing session, check if locked out
            if (session != null)
            {
                var timeSinceLastFetch = DateTime.UtcNow - session.LastFetched;
                if (timeSinceLastFetch < TimeSpan.FromHours(24))
                {
                    // user is locked out from a new batch => can only see leftover from the old batch
                    var nextAllowedFetch = session.LastFetched.AddHours(24);
                    var waitMinutes = (int)(nextAllowedFetch - DateTime.UtcNow).TotalMinutes;
                    var hoursLeft = waitMinutes / 60;
                    var minsLeft = waitMinutes % 60;

                    // gather leftover (IsActive) groups
                    var leftoverGroupIds = session.FetchedGroups
                        .Where(fg => fg.IsActive)
                        .Select(fg => fg.GroupId)
                        .ToList();

                    if (leftoverGroupIds.Any())
                    {
                        // Return leftover
                        var leftoverGroups = await _context.Groups
                            .AsNoTracking()
                            .Where(g => leftoverGroupIds.Contains(g.Id))
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
                            groups = leftoverGroups,
                            message = $"You can explore new groups again in {hoursLeft}h {minsLeft}m"
                        });
                    }

                    // no leftover => locked out with an empty list
                    return Ok(new
                    {
                        mustWait = true,
                        groups = new object[] { },
                        message = $"You can explore new groups again in {hoursLeft}h {minsLeft}m"
                    });
                }
            }

            // 2) If we get here, the user is not locked out (either no session or >24h have passed)
            //    => fetch a new batch

            // Exclude groups user is in, groups they skipped, groups they've applied to, etc.
            var currentUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // 2a) groups user is a member of
            var userGroupIds = await _context.GroupMembers
                .Where(gm => gm.UserId == currentUserIdValue && gm.IsAccepted)
                .Select(gm => gm.GroupId)
                .ToListAsync();

            // 2b) groups user has skipped
            var skippedGroupIds = await _context.SkippedGroups
                .Where(sg => sg.UserId == currentUserIdValue)
                .Select(sg => sg.GroupId)
                .ToListAsync();

            // 2c) groups user has already applied to
            var appliedGroupIds = await _context.GroupApplicationRequests
                .Where(gar =>
                    gar.ApplicantId == currentUserIdValue &&
                    !gar.IsDeclined &&
                    !gar.IsAccepted
                )
                .Select(gar => gar.GroupId)
                .ToListAsync();

            // 2d) combine
            var excludedGroupIds = userGroupIds
                .Concat(skippedGroupIds)
                .Concat(appliedGroupIds)
                .Distinct()
                .ToList();

            // 3) Grab up to 8 new groups
            var newBatch = await _context.Groups
                .AsNoTracking()
                .Where(g => g.isPublic && !excludedGroupIds.Contains(g.Id))
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

            // 4) If none found => do NOT lock out => user can try again
            if (!newBatch.Any())
            {
                return Ok(new
                {
                    mustWait = false,
                    groups = newBatch,
                    message = "No groups found. Try again soon!"
                });
            }

            // 5) We found some => record or update session => user is locked for 24h
            if (session == null)
            {
                session = new GroupExploreSession
                {
                    UserId = currentUserIdValue,
                    LastFetched = DateTime.UtcNow,
                    FetchedGroups = new List<GroupExploreSessionGroup>()
                };
                _context.GroupExploreSessions.Add(session);
            }
            else
            {
                // existing session is older than 24h => refresh it
                session.LastFetched = DateTime.UtcNow;
                _context.GroupExploreSessions.Update(session);
            }

            // 6) add these groups to the session
            foreach (var gObj in newBatch)
            {
                session.FetchedGroups.Add(new GroupExploreSessionGroup
                {
                    GroupId = gObj.Id,
                    IsActive = true
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mustWait = true,
                groups = newBatch,
                message = "You've used all your requests for today, lets give the groups time respond to your applications! Check back tomorrow for more opportunities"
            });
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

            // 2) Mark group as inactive in the session so it doesn’t appear again
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

            // Check membership or existing application...
            var existingMember = await _context.GroupMembers
                .FirstOrDefaultAsync(gm => gm.GroupId == model.GroupId && gm.UserId == currentUserId);
            if (existingMember != null)
            {
                return BadRequest("You are already a member of this group.");
            }

            var existingApplication = await _context.GroupApplicationRequests
                .FirstOrDefaultAsync(gar => gar.GroupId == model.GroupId && gar.ApplicantId == currentUserId && !gar.IsDeclined);
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

            // 3) Mark group as inactive in the session
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

        // For the scenario where user might "accept" a DM invitation:
        // we do the same approach: find the user's GroupExploreSession, mark that group IsActive=false
        // so it won't appear if they reload GroupExplore.
        // (This depends on how you structure group invitations in your app.)
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
