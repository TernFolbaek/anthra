using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyBackendApp.Data;
using MyBackendApp.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExploreController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;

    private static readonly TimeSpan LOCKOUT_DURATION = TimeSpan.FromHours(24);

    public ExploreController(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    [HttpGet("GetUsers")]
    public async Task<IActionResult> GetUsers()
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // Load session (if any)
        var session = await _context.UserExploreSessions
            .Include(s => s.FetchedUsers)
            .FirstOrDefaultAsync(s => s.UserId == currentUserId);

        // 1) If session exists and user is still locked out => return leftover or empty
        if (session != null)
        {
            var timeSinceLastFetch = DateTime.UtcNow - session.LastFetched;
            if (timeSinceLastFetch < LOCKOUT_DURATION)
            {
                var nextAllowedFetch = session.LastFetched.Add(LOCKOUT_DURATION);
                var waitMinutes = (int)(nextAllowedFetch - DateTime.UtcNow).TotalMinutes;
                var hoursLeft = waitMinutes / 60;
                var minsLeft = waitMinutes % 60;

                // leftover active user IDs
                var leftoverIds = session.FetchedUsers
                    .Where(fu => fu.IsActive)
                    .Select(fu => fu.FetchedUserId)
                    .ToList();

                if (leftoverIds.Any())
                {
                    var leftoverUsers = await _userManager.Users
                        .AsNoTracking()
                        .Where(u => leftoverIds.Contains(u.Id))
                        .Select(u => new
                        {
                            u.Id,
                            u.FirstName,
                            u.LastName,
                            u.Location,
                            u.Institution,
                            u.Work,
                            u.Courses,
                            u.Subjects,
                            u.Statuses,
                            u.AboutMe,
                            u.Age,
                            u.ProfilePictureUrl
                        })
                        .ToListAsync();

                    return Ok(new
                    {
                        mustWait = true,
                        users = leftoverUsers,
                        message = $"You can explore new users again in {hoursLeft}h {minsLeft}m"
                    });
                }

                // no leftover => locked out with empty
                return Ok(new
                {
                    mustWait = true,
                    users = new List<object>(),
                    message = $"You can explore new users again in {hoursLeft}h {minsLeft}m"
                });
            }
            // else => session is older than lockout => we can fetch again
        }

        // 2) Build the exclude list for new fetches
        var connectedUserIds = await _context.Connections
            .Where(c => c.UserId1 == currentUserId || c.UserId2 == currentUserId)
            .Select(c => c.UserId1 == currentUserId ? c.UserId2 : c.UserId1)
            .ToListAsync();

        var sentRequestUserIds = await _context.ConnectionRequests
            .Where(cr => cr.SenderId == currentUserId && cr.Status == ConnectionStatus.Pending)
            .Select(cr => cr.ReceiverId)
            .ToListAsync();

        var skippedUserIds = await _context.SkippedUsers
            .Where(su => su.UserId == currentUserId)
            .Select(su => su.SkippedUserId)
            .ToListAsync();

        var excludedUserIds = connectedUserIds
            .Concat(sentRequestUserIds)
            .Concat(skippedUserIds)
            .Append(currentUserId)
            .Distinct()
            .ToList();

        // If no session => create one
        if (session == null)
        {
            session = new UserExploreSession
            {
                UserId = currentUserId,
                LastFetched = DateTime.UtcNow,
                FetchedUsers = new List<UserExploreSessionUser>()
            };
            _context.UserExploreSessions.Add(session);

            // Grab up to 2 new users
            var firstBatch = await _userManager.Users
                .AsNoTracking()
                .Where(u => u.ProfileCompleted && !excludedUserIds.Contains(u.Id))
                .Take(8)
                .ToListAsync();

            if (!firstBatch.Any())
            {
                return Ok(new
                {
                    mustWait = false,
                    users = new List<object>(),
                    message = "No new users found. Try again soon!"
                });
            }

            // Add them to session
            foreach (var user in firstBatch)
            {
                session.FetchedUsers.Add(new UserExploreSessionUser
                {
                    FetchedUserId = user.Id,
                    IsActive = true
                });
            }

            await _context.SaveChangesAsync();

            var results = firstBatch.Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Location,
                u.Institution,
                u.Work,
                u.Courses,
                u.Subjects,
                u.Statuses,
                u.AboutMe,
                u.Age,
                u.ProfilePictureUrl
            }).ToList();

            return Ok(new
            {
                mustWait = true,
                users = results,
                message = "Here is your new batch! Check back after the lockout period for more."
            });
        }
        else
        {
            // Session is older than the lockout => partial fetch

            // Remove all inactive from the session
            var inactive = session.FetchedUsers
                .Where(fu => !fu.IsActive)
                .ToList();
            foreach (var user in inactive)
            {
                session.FetchedUsers.Remove(user);
            }

            // leftover active count
            var leftoverActiveCount = session.FetchedUsers.Count(fu => fu.IsActive);


            var needed = 8 - leftoverActiveCount;

            // IMPORTANT: also exclude leftover active IDs so we don't re-fetch them
            var leftoverActiveIds = session.FetchedUsers
                .Where(fu => fu.IsActive)
                .Select(fu => fu.FetchedUserId)
                .ToList();

            var excludeAlso = excludedUserIds
                .Concat(leftoverActiveIds)
                .Distinct()
                .ToList();

            var newBatch = new List<ApplicationUser>();
            if (needed > 0)
            {
                newBatch = await _userManager.Users
                    .AsNoTracking()
                    .Where(u => 
                        u.ProfileCompleted &&
                        !excludeAlso.Contains(u.Id) // Exclude leftover IDs
                    )
                    .Take(needed)
                    .ToListAsync();
            }

            if (!newBatch.Any() && leftoverActiveCount < 8)
            {
                return Ok(new
                {
                    mustWait = false,
                    users = new List<object>(),
                    message = "No new users at the moment. Try again soon!"
                });
            }

            // Otherwise, lock them out again
            session.LastFetched = DateTime.UtcNow;

            // Add the newly fetched to session
            foreach (var user in newBatch)
            {
                session.FetchedUsers.Add(new UserExploreSessionUser
                {
                    FetchedUserId = user.Id,
                    IsActive = true
                });
            }

            _context.UserExploreSessions.Update(session);
            await _context.SaveChangesAsync();

            // Build final return
            var activeUserIds = session.FetchedUsers
                .Where(fu => fu.IsActive)
                .Select(fu => fu.FetchedUserId)
                .ToList();

            var finalList = await _userManager.Users
                .AsNoTracking()
                .Where(u => activeUserIds.Contains(u.Id))
                .Select(u => new
                {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Location,
                    u.Institution,
                    u.Work,
                    u.Courses,
                    u.Subjects,
                    u.Statuses,
                    u.AboutMe,
                    u.Age,
                    u.ProfilePictureUrl
                })
                .ToListAsync();

            return Ok(new
            {
                mustWait = true,
                users = finalList,
                message = "Now we await the users to respond to your requests!"
            });
        }
    }

    // ------------------------------------------------------------------
    // SkipUser
    // ------------------------------------------------------------------
    [HttpPost("SkipUser")]
    public async Task<IActionResult> SkipUser([FromBody] SkipUserModel model)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (currentUserId == model.UserIdToSkip)
        {
            return BadRequest("You cannot skip yourself.");
        }

        // 1) Add to SkippedUsers
        var existingSkip = await _context.SkippedUsers
            .FirstOrDefaultAsync(su => su.UserId == currentUserId && su.SkippedUserId == model.UserIdToSkip);

        if (existingSkip == null)
        {
            var skippedUser = new SkippedUserModel
            {
                UserId = currentUserId,
                SkippedUserId = model.UserIdToSkip,
                SkippedAt = DateTime.UtcNow
            };
            _context.SkippedUsers.Add(skippedUser);
        }

        // 2) Mark user as inactive in the session
        var session = await _context.UserExploreSessions
            .Include(s => s.FetchedUsers)
            .FirstOrDefaultAsync(s => s.UserId == currentUserId);

        if (session != null)
        {
            var sessionUser = session.FetchedUsers
                .FirstOrDefault(fu => fu.FetchedUserId == model.UserIdToSkip && fu.IsActive);

            if (sessionUser != null)
            {
                sessionUser.IsActive = false;
            }

            _context.UserExploreSessions.Update(session);
        }

        await _context.SaveChangesAsync();
        return Ok();
    }
}

public class SkipUserModel
{
    public string UserIdToSkip { get; set; }
}
