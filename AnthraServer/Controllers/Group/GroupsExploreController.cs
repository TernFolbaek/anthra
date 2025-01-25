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

            // 1) Load (if any) the existing group-explore session
            var session = await _context.GroupExploreSessions
                .Include(s => s.FetchedGroups)
                .FirstOrDefaultAsync(s => s.UserId == currentUserId);

            // ------------------------------------------------------------
            // CASE A: The session exists and we're still in lockout
            // ------------------------------------------------------------
            if (session != null)
            {
                var timeSinceLastFetch = DateTime.UtcNow - session.LastFetched;
                if (timeSinceLastFetch < LOCKOUT_DURATION)
                {
                    var nextAllowedFetch = session.LastFetched.Add(LOCKOUT_DURATION);
                    var waitMinutes = (int)(nextAllowedFetch - DateTime.UtcNow).TotalMinutes;
                    var hoursLeft = waitMinutes / 60;
                    var minsLeft = waitMinutes % 60;

                    // leftover: currently active group IDs
                    var leftoverGroupIds = session.FetchedGroups
                        .Where(fg => fg.IsActive)
                        .Select(fg => fg.GroupId)
                        .ToList();

                    if (leftoverGroupIds.Any())
                    {
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

                    // no leftover => locked out with empty
                    return Ok(new
                    {
                        mustWait = true,
                        groups = Array.Empty<object>(),
                        message = $"You can explore new groups again in {hoursLeft}h {minsLeft}m"
                    });
                }
                // If here => session is older than lockout => we can fetch new
            }

            // ------------------------------------------------------------
            // CASE B: No session or lockout expired => fetch new groups
            // ------------------------------------------------------------

            // 2) Build an exclude list
            //  - groups user is a member of
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

            var excludedGroupIds = userGroupIds
                .Concat(skippedGroupIds)
                .Concat(appliedGroupIds)
                .Distinct()
                .ToList();

            // 3) If there's no session, create a new one
            if (session == null)
            {
                session = new GroupExploreSession
                {
                    UserId = currentUserId,
                    LastFetched = DateTime.UtcNow,
                    FetchedGroups = new List<GroupExploreSessionGroup>()
                };
                _context.GroupExploreSessions.Add(session);

                // fetch up to 2 new groups
                var firstBatch = await _context.Groups
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

                // if none => do not lock out
                if (!firstBatch.Any())
                {
                    return Ok(new
                    {
                        mustWait = false,
                        groups = firstBatch,
                        message = "No groups found. Try again soon!"
                    });
                }

                // otherwise, add them
                foreach (var gObj in firstBatch)
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
                    groups = firstBatch,
                    message = "Here is your new batch! Check back after the lockout period for more."
                });
            }
            else
            {
                // We have an existing session older than lockout => partial fetch

                // 1) Remove any that are no longer active
                var inactiveGroups = session.FetchedGroups
                    .Where(fg => !fg.IsActive)
                    .ToList();

                foreach (var inact in inactiveGroups)
                {
                    session.FetchedGroups.Remove(inact);
                }

                // 2) Count how many remain active
                var leftoverActiveCount = session.FetchedGroups.Count(fg => fg.IsActive);

                // 3) We want 2 total, so how many needed?
                var needed = 8 - leftoverActiveCount;

                // 4) Also exclude leftover active IDs so we never re-fetch the same group
                var leftoverActiveIds = session.FetchedGroups
                    .Where(fg => fg.IsActive)
                    .Select(fg => fg.GroupId)
                    .ToList();

                var excludeAdditionally = excludedGroupIds
                    .Concat(leftoverActiveIds)
                    .Distinct()
                    .ToList();

                // fetch new if needed
                var newBatch = new List<dynamic>();
                if (needed > 0)
                {
                    var fetched = await _context.Groups
                        .AsNoTracking()
                        .Where(g =>
                            g.isPublic &&
                            !excludeAdditionally.Contains(g.Id)
                        )
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
                        .Take(needed)
                        .ToListAsync();

                    newBatch.AddRange(fetched);
                }

                // 5) If no new and leftover < 8 => do NOT lock out => can try again
                if (!newBatch.Any() && leftoverActiveCount < 8)
                {
                    return Ok(new
                    {
                        mustWait = false,
                        groups = newBatch,
                        message = "No new groups found. Try again soon!"
                    });
                }

                // otherwise => we have leftover or new => user uses fetch => lock out
                session.LastFetched = DateTime.UtcNow;

                // Add newly fetched to session
                foreach (var gObj in newBatch)
                {
                    session.FetchedGroups.Add(new GroupExploreSessionGroup
                    {
                        GroupId = gObj.Id,
                        IsActive = true
                    });
                }

                _context.GroupExploreSessions.Update(session);
                await _context.SaveChangesAsync();

                // Build final list
                var activeGroupIds = session.FetchedGroups
                    .Where(fg => fg.IsActive)
                    .Select(fg => fg.GroupId)
                    .ToList();

                var finalList = await _context.Groups
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
                    groups = finalList,
                    message = "Now we await the groups to look at your applications 🎉"
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
