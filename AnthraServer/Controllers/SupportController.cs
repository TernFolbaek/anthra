using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MyBackendApp.Data;
using MyBackendApp.Models;
using MyBackendApp.ViewModels;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace AnthraBackend.Controllers.Account
{
    [ApiController]
    [Route("api/[controller]")]
    public class SupportController : ControllerBase
    {

        private readonly ILogger<SupportController> _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;

        public SupportController(UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ILogger<SupportController> logger,
            IConfiguration configuration,
            ApplicationDbContext context
            )
        {
            _context = context;
            _userManager = userManager;
            _signInManager = signInManager;
            _logger = logger;
            _configuration = configuration;
        }
        
        [HttpPost("SendSupportEmail")]

public async Task<IActionResult> SendSupportEmail([FromBody] SupportEmailRequest model)
{
    _logger.LogInformation("SendSupportEmail action called");


    var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
    if (string.IsNullOrEmpty(userEmail))
    {
        return Unauthorized("User not authenticated.");
    }

    try
    {
        var apiKey = _configuration["SendGrid:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogError("SendGrid API Key is not configured.");
            return StatusCode(500, "Email service is not configured.");
        }

        var client = new SendGridClient(apiKey);
        var fromEmail = "admin@anthra.dk";
        var from = new EmailAddress(fromEmail, "Support Request");
        var to = new EmailAddress("anthradk@gmail.com"); 
        var subject = "Support Request from User";
        
        var plainTextContent = $"Support Request from: {userEmail}\n\nMessage:\n{model.Message}";
        var htmlContent = $@"
            <p><strong>Support Request from:</strong> {userEmail}</p>
            <p><strong>Message:</strong></p>
            <p>{System.Web.HttpUtility.HtmlEncode(model.Message)}</p>
        ";

        var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);

        var response = await client.SendEmailAsync(msg);
        var responseBody = await response.Body.ReadAsStringAsync();

        if (response.StatusCode != System.Net.HttpStatusCode.Accepted)
        {
            _logger.LogError("Failed to send support email via SendGrid: {StatusCode} - {ResponseBody}", response.StatusCode, responseBody);
            return StatusCode(500, "Error sending support email.");
        }

        return Ok("Support email sent successfully.");
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error sending support email.");
        return StatusCode(500, "Error sending support email.");
    }
}

public class SupportEmailRequest
{
    public string Message { get; set; }
}

[HttpPost("SendSupportEmailGuest")]
public async Task<IActionResult> SendSupportEmailGuest([FromBody] GuestSupportEmailRequest model)
{
    _logger.LogInformation("SendSupportEmailGuest action called");

    try
    {
        var apiKey = _configuration["SendGrid:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogError("SendGrid API Key is not configured.");
            return StatusCode(500, "Email service is not configured.");
        }

        var client = new SendGridClient(apiKey);
        var fromEmail = "admin@anthra.dk";
        var from = new EmailAddress(fromEmail, "Guest Support Request");
        var to = new EmailAddress("anthradk@gmail.com"); 
        var subject = "Guest Support Request";
        
        var plainTextContent = $"From: {model.Email}\n\nSubject: {model.Subject}\n\nMessage:\n{model.Message}";
        var htmlContent = $@"
            <p><strong>From:</strong> {System.Web.HttpUtility.HtmlEncode(model.Email)}</p>
            <p><strong>Subject:</strong> {System.Web.HttpUtility.HtmlEncode(model.Subject)}</p>
            <p><strong>Message:</strong></p>
            <p>{System.Web.HttpUtility.HtmlEncode(model.Message)}</p>
        ";

        var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);

        var response = await client.SendEmailAsync(msg);
        var responseBody = await response.Body.ReadAsStringAsync();

        if (response.StatusCode != System.Net.HttpStatusCode.Accepted)
        {
            _logger.LogError("Failed to send guest support email via SendGrid: {StatusCode} - {ResponseBody}", response.StatusCode, responseBody);
            return StatusCode(500, "Error sending support email.");
        }

        return Ok("Support email sent successfully.");
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error sending guest support email.");
        return StatusCode(500, "Error sending support email.");
    }
}

public class GuestSupportEmailRequest
{
    public string Email { get; set; }
    public string Subject { get; set; }
    public string Message { get; set; }
}
    
    }
}