using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MyBackendApp.Data;
using MyBackendApp.Models;
using MyBackendApp.ViewModels;

namespace MyBackendApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
// In your ConnectionRequestsController
    public class RequestController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RequestController( ApplicationDbContext context)
        {

            _context = context;

        }
        [HttpGet("Accepted")]
        public async Task<IActionResult> GetAcceptedConnections(string userId)
        {
            var acceptedConnections = await _context.ConnectionRequests
                .Include(cr => cr.Sender)
                .Include(cr => cr.Receiver)
                .Where(cr => cr.Status == ConnectionStatus.Accepted &&
                             (cr.SenderId == userId || cr.ReceiverId == userId))
                .ToListAsync();

            return Ok(acceptedConnections);
        }
    }
}