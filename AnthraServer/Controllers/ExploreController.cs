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

        // 1) Load or find the single session for this user (if any)
        var session = await _context.UserExploreSessions
            .Include(s => s.FetchedUsers)
            .FirstOrDefaultAsync(s => s.UserId == currentUserId);

        // 2) If session already exists, check if user is still locked out
        if (session != null)
        {
            var timeSinceLastFetch = DateTime.UtcNow - session.LastFetched;
            if (timeSinceLastFetch < LOCKOUT_DURATION)
            {
                // => They must reuse leftover from the existing session
                var nextAllowedFetch = session.LastFetched.Add(LOCKOUT_DURATION);
                var waitMinutes = (int)(nextAllowedFetch - DateTime.UtcNow).TotalMinutes;
                var hoursLeft = waitMinutes / 60;
                var minsLeft = waitMinutes % 60;

                // Get any leftover "active" users
                var leftoverIds = session.FetchedUsers
                    .Where(fu => fu.IsActive)
                    .Select(fu => fu.FetchedUserId)
                    .ToList();

                if (leftoverIds.Any())
                {
                    // Return leftover
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

                // No leftover => locked out with empty
                return Ok(new
                {
                    mustWait = true,
                    users = new List<object>(),
                    message = $"You can explore new users again in {hoursLeft}h {minsLeft}m"
                });
            }

            // If we are here => the old session is older than lockout => user can fetch a new batch
            // We'll reuse the *same* session object, just updating LastFetched below
        }

        // 3) Build an exclude list: connected, pending requests, or skipped
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

        // 4) Fetch up to 2 new users (for testing)
        var newBatch = await _userManager.Users
            .AsNoTracking()
            .Where(u => u.ProfileCompleted && !excludedUserIds.Contains(u.Id))
            .Take(8)
            .ToListAsync();

        // 5) If no new users => do NOT lock out => user can keep trying
        if (!newBatch.Any())
        {
            return Ok(new
            {
                mustWait = false,
                users = new List<object>(),
                message = "Awaiting new users. Try again soon!"
            });
        }

        // 6) We have some new users => user "uses" their fetch => locked out
        // Either create or reuse the session
        if (session == null)
        {
            // Create a new session
            session = new UserExploreSession
            {
                UserId = currentUserId,
                LastFetched = DateTime.UtcNow,
                FetchedUsers = new List<UserExploreSessionUser>()
            };
            _context.UserExploreSessions.Add(session);
        }
        else
        {
            // Reuse existing session => refresh LastFetched
            session.LastFetched = DateTime.UtcNow;

            // Optionally, if you want a *completely fresh* list, you could do:
            // session.FetchedUsers.Clear();  (or set them Inactive)
            // But typically, you can just keep them for history or debugging.
            _context.UserExploreSessions.Update(session);
        }

        // Add new batch
        foreach (var user in newBatch)
        {
            session.FetchedUsers.Add(new UserExploreSessionUser
            {
                FetchedUserId = user.Id,
                IsActive = true
            });
        }

        await _context.SaveChangesAsync();

        // Build final return
        var results = newBatch.Select(u => new
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

        // 1) Add to SkippedUsers for future fetches
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

        // 2) Mark user as inactive in the single session
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

            // Update the session so EF saves the changes
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
