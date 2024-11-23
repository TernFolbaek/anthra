// Controllers/RequestsController.cs

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyBackendApp.Data;
using MyBackendApp.Models;

[ApiController]
[Route("api/[controller]")]
public class RequestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public RequestsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet("GetGroupApplicationRequests")]
    [Authorize]
    public async Task<IActionResult> GetGroupApplicationRequests()
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var requests = await _context.GroupApplicationRequests
            .Include(r => r.Applicant)
            .Include(r => r.Group)
            .Where(r => r.AdminId == adminId && !r.IsAccepted && !r.IsDeclined)
            .ToListAsync();

        var result = requests.GroupBy(r => r.Group)
            .Select(g => new
            {
                GroupId = g.Key.Id,
                GroupName = g.Key.Name,
                Applications = g.Select(a => new
                {
                    RequestId = a.Id,
                    ApplicantId = a.ApplicantId,
                    ApplicantName = $"{a.Applicant.FirstName} {a.Applicant.LastName}",
                    ApplicantProfilePictureUrl = a.Applicant.ProfilePictureUrl,
                    RequestedAt = a.RequestedAt
                })
            });

        return Ok(result);
    }

    [HttpPost("RespondToGroupApplication")]
    [Authorize]
    public async Task<IActionResult> RespondToGroupApplication([FromBody] RespondToGroupApplicationModel model)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var request = await _context.GroupApplicationRequests
            .Include(r => r.Group)
            .FirstOrDefaultAsync(r => r.Id == model.RequestId);

        if (request == null)
        {
            return NotFound("Request not found.");
        }

        if (request.AdminId != adminId)
        {
            return Forbid("You are not authorized to respond to this request.");
        }

        if (model.Accept)
        {
            request.IsAccepted = true;

            // Add user to group members
            var groupMember = new GroupMember
            {
                GroupId = request.GroupId,
                UserId = request.ApplicantId,
                IsAccepted = true
            };
            _context.GroupMembers.Add(groupMember);
        }
        else
        {
            request.IsDeclined = true;
        }

        await _context.SaveChangesAsync();

        return Ok();
    }
}

public class RespondToGroupApplicationModel
{
    public int RequestId { get; set; }
    public bool Accept { get; set; }
}
