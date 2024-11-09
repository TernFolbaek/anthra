using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using MyBackendApp.Models;
using MyBackendApp.ViewModels;
using Google.Apis.Auth;
using MyBackendApp.Data;
using SendGrid;
using SendGrid.Helpers.Mail;


namespace MyBackendApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ILogger<AuthController> _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;

        public AuthController(UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ILogger<AuthController> logger,
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

        [HttpPost("GoogleLogin")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginViewModel model)
        {
            _logger.LogInformation("Received tokenId: {TokenId}", model.TokenId);

            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = new List<string> { "995421977806-tf8qlcn3jt95q5m5ug5ppbqq4c0mnj6o.apps.googleusercontent.com" }
                };

                var payload = await GoogleJsonWebSignature.ValidateAsync(model.TokenId, settings);

                // Check if the user already exists
                var user = await _userManager.FindByEmailAsync(payload.Email);

                if (user == null)
                {
                    // Create a new user without a password
                    user = new ApplicationUser
                    {
                        UserName = payload.Email,
                        Email = payload.Email,
                        EmailConfirmed = true // Since Google already verified the email
                    };

                    var result = await _userManager.CreateAsync(user);
                    if (!result.Succeeded)
                    {
                        
                        return BadRequest("Failed to create user.");
                    }
                }

                // Generate JWT token
                var token = GenerateJwtToken(user);

                return Ok(new { token, userId = user.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Google login failed.");
                
                return StatusCode(500, new { Error = ex.Message });
            }
        }
        // POST: api/Auth/Register
        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] RegisterViewModel model)
        {
            _logger.LogInformation("Register action called");

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);
                _logger.LogWarning("ModelState is invalid: {Errors}", string.Join("; ", errors));
                return BadRequest(new { errors });
            }

            var user = new ApplicationUser { UserName = model.Username, Email = model.Email };
            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                _logger.LogInformation("User created a new account with password.");

                // Sign in the user to create the authentication cookie
                await _signInManager.SignInAsync(user, isPersistent: false);

                var token = GenerateJwtToken(user);

                return Ok(new { Message = "Registration successful", userId = user.Id, token });
            }

            foreach (var error in result.Errors)
            {
                _logger.LogWarning("Error creating user: {Code} - {Description}", error.Code, error.Description);
                ModelState.AddModelError(error.Code, error.Description);
            }

            return BadRequest(ModelState);
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginViewModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _signInManager.PasswordSignInAsync(
                userName: model.Username,
                password: model.Password,
                isPersistent: false,
                lockoutOnFailure: false);

            if (result.Succeeded)
            {
                var user = await _userManager.FindByNameAsync(model.Username);
                var token = GenerateJwtToken(user);

                // cookie
                return Ok(new { Message = "Registration successful", userId = user.Id, token, userName = user.UserName });
            }

            return Unauthorized("Invalid username or password.");
        }

        private string GenerateJwtToken(ApplicationUser user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSettings["Secret"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName),
                new Claim(JwtRegisteredClaimNames.Email, user.Email)
                // Add more claims if needed
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpirationInMinutes"])),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
        
        [HttpGet("ExternalLogin")]
        public IActionResult ExternalLogin(string provider, string returnUrl = null)
        {
            var redirectUrl = Url.Action("ExternalLoginCallback", "Auth", new { returnUrl });
            var properties = _signInManager.ConfigureExternalAuthenticationProperties(provider, redirectUrl);
            return Challenge(properties, provider);
        }

        [HttpGet("ExternalLoginCallback")]
        public async Task<IActionResult> ExternalLoginCallback(string returnUrl = null, string remoteError = null)
        {
            if (remoteError != null)
            {
                _logger.LogError("Error from external provider: {Error}", remoteError);
                return BadRequest("Error from external provider.");
            }

            var info = await _signInManager.GetExternalLoginInfoAsync();
            if (info == null)
            {
                return BadRequest("Error loading external login information.");
            }

            var signInResult = await _signInManager.ExternalLoginSignInAsync(info.LoginProvider, info.ProviderKey, isPersistent: false);

            if (signInResult.Succeeded)
            {
                // User logged in with external provider
                var user = await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
                var token = GenerateJwtToken(user);
                return Redirect($"{returnUrl}?token={token}&userId={user.Id}");
            }
            else
            {
                // If the user does not have an account, create one
                var email = info.Principal.FindFirstValue(ClaimTypes.Email);
                var user = new ApplicationUser { UserName = email, Email = email };

                var result = await _userManager.CreateAsync(user);
                if (result.Succeeded)
                {
                    result = await _userManager.AddLoginAsync(user, info);
                    if (result.Succeeded)
                    {
                        var token = GenerateJwtToken(user);
                        return Redirect($"{returnUrl}?token={token}&userId={user.Id}");
                    }
                }
                return BadRequest("External login failed.");
            }
        }
        

   [HttpPost("ForgotPassword")]
public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordViewModel model)
{
    _logger.LogInformation("ForgotPassword action called");

    var user = await _userManager.FindByEmailAsync(model.Email);
    if (user == null)
    {
        return BadRequest("User not found.");
    }

    // Generate reset code
    var resetCode = new Random().Next(100000, 999999).ToString();

    // Set code and expiry
    user.PasswordResetCode = resetCode;
    user.PasswordResetExpiry = DateTime.UtcNow.AddHours(1);

    await _userManager.UpdateAsync(user);

    // Send email using SendGrid
    try
    {
        var apiKey = _configuration["SendGrid:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogError("SendGrid API Key is not configured.");
            return StatusCode(500, "Email service is not configured.");
        }

        var client = new SendGridClient(apiKey);
        var fromEmail = "anthradk@gmail.com";
        var from = new EmailAddress(fromEmail, "anthradk@gmail.com");
        var to = new EmailAddress(model.Email);
        var subject = "Password Reset Code";
        var plainTextContent = $"Your password reset code is: {resetCode}";
        var htmlContent = $"<p>Your password reset code is: <strong>{resetCode}</strong></p>";
        var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);

        var response = await client.SendEmailAsync(msg);
        var responseBody = await response.Body.ReadAsStringAsync();

        if (response.StatusCode != System.Net.HttpStatusCode.Accepted)
        {
            _logger.LogError("Failed to send email via SendGrid: {StatusCode} - {ResponseBody}", response.StatusCode, responseBody);
            return StatusCode(500, "Error sending password reset email.");
        }
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error sending password reset email.");
        return StatusCode(500, "Error sending password reset email.");
    }

    return Ok("Password reset code sent to your email.");
}

        
        [HttpPost("ResetPassword")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordViewModel model)
        {
            _logger.LogInformation("ResetPassword action called");

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return BadRequest("User not found.");
            }

            if (user.PasswordResetCode != model.Code || user.PasswordResetExpiry < DateTime.UtcNow)
            {
                return BadRequest("Invalid or expired reset code.");
            }

            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, resetToken, model.NewPassword);

            if (result.Succeeded)
            {
                // Clear reset code and expiry
                user.PasswordResetCode = null;
                user.PasswordResetExpiry = null;
                await _userManager.UpdateAsync(user);

                return Ok("Password has been reset successfully.");
            }
            else
            {
                return BadRequest("Error resetting password.");
            }
        }


        
    }
}