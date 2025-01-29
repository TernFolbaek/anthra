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
        
        var session = await _context.UserExploreSessions
            .Include(s => s.FetchedUsers)
            .FirstOrDefaultAsync(s => s.UserId == currentUserId);
        

        if (session != null)
        {
            var timeSinceLastFetch = DateTime.UtcNow - session.LastFetched;
            if (timeSinceLastFetch >= LOCKOUT_DURATION)
            {
                session.FetchedUsers.Clear();
            }
            else
            {
                // Within lockout period, return existing fetched users
                var remainingLockout = LOCKOUT_DURATION - timeSinceLastFetch;
                var hoursLeft = (int)remainingLockout.TotalHours;
                var minsLeft = remainingLockout.Minutes;

                var activeFetchedUserIds = session.FetchedUsers
                    .Where(fu => fu.IsActive)
                    .Select(fu => fu.FetchedUserId)
                    .ToList();

           
                    var activeUsers = await _userManager.Users
                        .AsNoTracking()
                        .Where(u => activeFetchedUserIds.Contains(u.Id))
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
                        users = activeUsers,
                        message = $"You can explore new users again in {hoursLeft}h {minsLeft}m"
                    });
            }
        }
        else
        {
            session = new UserExploreSession
            {
                UserId = currentUserId,
                LastFetched = DateTime.UtcNow,
                FetchedUsers = new List<UserExploreSessionUser>()
            };
            _context.UserExploreSessions.Add(session);
        }
        
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

        // Fetch 8 new users
        var newUsers = await _userManager.Users
            .AsNoTracking()
            .Where(u => u.ProfileCompleted && !excludedUserIds.Contains(u.Id))
            .Take(2)
            .ToListAsync();

        if (newUsers.Any())
        {
            session.LastFetched = DateTime.UtcNow;
            session.FetchedUsers = newUsers.Select(u => new UserExploreSessionUser
            {
                FetchedUserId = u.Id,
                IsActive = true
            }).ToList();

            await _context.SaveChangesAsync();

            var results = newUsers.Select(u => new
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
                mustWait = false,
                users = results,
                message = "Here are your new users to explore!"
            });
        }
        else
        {
            session.LastFetched = DateTime.UtcNow.AddHours(-25);
            return Ok(new
            {
                mustWait = false,
                users = new List<object>(),
                message = "No new users found. Try again later!"
            });
        }
    }

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
