using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyBackendApp.Data;
using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using Newtonsoft.Json; // If using Newtonsoft for JSON
using System.Security.Claims;

namespace MyBackendApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]  // Ensure the user is authenticated
    public class ReportController : ControllerBase
    {
        // Ideally, these should come from your appsettings.json or secure config (not hardcoded)
        private readonly string _telegramBotToken = "7954138299:AAGPne8Z1-KpG9LpHCFD9FoEMtXItCOMUPc";
        private readonly string _telegramChatId   = "7731233891";

        private readonly ApplicationDbContext _context;

        public ReportController(ApplicationDbContext context)
        {
            _context = context;
        }

        // -------------------------------------------------
        // POST: api/Report/SendReport
        // -------------------------------------------------
        [HttpPost("SendReport")]
        public async Task<IActionResult> SendReport([FromForm] ReportRequest request)
        {
            try
            {
                // Identify the user who is reporting
                string reporterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // Basic validation (just in case)
                if (string.IsNullOrWhiteSpace(request.Description))
                {
                    return BadRequest("Description is required.");
                }

                // 1. Send the text to Telegram
                string messageText = 
                    $"**New Report**\n\n" +
                    $"Reporter (userId): {reporterUserId}\n" +
                    $"Reported userId: {request.ReportedUserId}\n\n" +
                    $"Description:\n{request.Description}";

                await SendTelegramMessageAsync(messageText);

                // 2. Send any attached screenshots (photos) if present
                if (request.Screenshots != null && request.Screenshots.Count > 0)
                {
                    foreach (var screenshot in request.Screenshots)
                    {
                        if (screenshot.Length > 0)
                        {
                            // Send screenshot as photo to Telegram
                            await SendTelegramPhotoAsync(screenshot);
                        }
                    }
                }

                // (Optional) Save report details to your database if you want an internal record
                // var report = new Report
                // {
                //     ReporterUserId = reporterUserId,
                //     ReportedUserId = request.ReportedUserId,
                //     Description = request.Description,
                //     CreatedAt = DateTime.UtcNow
                // };
                // _context.Reports.Add(report);
                // await _context.SaveChangesAsync();

                return Ok(new { message = "Report sent successfully." });
            }
            catch (Exception ex)
            {
                // Log exception here as needed
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = ex.Message });
            }
        }

        // -------------------------------------------------
        // Helper: Send text message to Telegram
        // -------------------------------------------------
        private async Task SendTelegramMessageAsync(string messageText)
        {
            using var client = new HttpClient();
            client.Timeout = TimeSpan.FromSeconds(30);

            var requestUrl = $"https://api.telegram.org/bot{_telegramBotToken}/sendMessage";
            var payload = new
            {
                chat_id = _telegramChatId,
                text = messageText,
                parse_mode = "Markdown" // So we can use basic formatting if desired
            };
            var json = JsonConvert.SerializeObject(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync(requestUrl, content);
            response.EnsureSuccessStatusCode();
        }

        // -------------------------------------------------
        // Helper: Send photo to Telegram
        // -------------------------------------------------
        private async Task SendTelegramPhotoAsync(IFormFile file)
        {
            using var client = new HttpClient();
            client.Timeout = TimeSpan.FromSeconds(30);

            var requestUrl = $"https://api.telegram.org/bot{_telegramBotToken}/sendPhoto";

            // Build multipart form data
            using var form = new MultipartFormDataContent();
            form.Add(new StringContent(_telegramChatId), "chat_id");

            // Convert IFormFile to StreamContent
            using var stream = file.OpenReadStream();
            var streamContent = new StreamContent(stream);
            form.Add(streamContent, "photo", file.FileName);

            var response = await client.PostAsync(requestUrl, form);
            response.EnsureSuccessStatusCode();
        }
    }

    // -----------------------------------------------------
    // Data model for the incoming request
    // -----------------------------------------------------
    public class ReportRequest
    {
        public string ReportedUserId { get; set; }
        public string Description { get; set; }

        // This matches the name used in your [FromForm] binding 
        // if you pass screenshots in a FormData as "Screenshots"
        public List<IFormFile>? Screenshots { get; set; }
    }
}
