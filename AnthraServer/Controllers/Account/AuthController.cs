using System.IdentityModel.Tokens.Jwt;
using System.Net.Mime;
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
            ApplicationDbContext context)
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
                    Audience = new List<string>
                        { "995421977806-tf8qlcn3jt95q5m5ug5ppbqq4c0mnj6o.apps.googleusercontent.com" }
                };

                var payload = await GoogleJsonWebSignature.ValidateAsync(model.TokenId, settings);

                // Check if the user already exists by email.
                var user = await _userManager.FindByEmailAsync(payload.Email);

                if (user == null)
                {
                    // Create a new user with the email (use email for UserName as well, since username is no longer used).
                    user = new ApplicationUser
                    {
                        // Although Identity still requires a UserName, we now set it automatically to the email.
                        UserName = payload.Email,
                        Email = payload.Email,
                        EmailConfirmed = true // Google has already verified the email.
                    };

                    var result = await _userManager.CreateAsync(user);
                    if (!result.Succeeded)
                    {
                        return BadRequest("Failed to create user.");
                    }
                }

                // Generate JWT token (note: username claim removed).
                var token = GenerateJwtToken(user);

                return Ok(new { token, userId = user.Id, fullName = user.FirstName + " " + user.LastName });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Google login failed.");
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] RegisterViewModel model)
        {
            _logger.LogInformation("Register action called");

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage).ToArray();
                _logger.LogWarning("ModelState is invalid: {Errors}", string.Join("; ", errors));
                return BadRequest(new { errors });
            }

            // Create a new user using the provided email.
            var user = new ApplicationUser
            {
                // Use the email for UserName as well.
                UserName = model.Email,
                Email = model.Email
            };
            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                _logger.LogInformation("User created a new account with password.");

                // Generate email verification code.
                var verificationCode = new Random().Next(100000, 999999).ToString();

                // Store the code and its expiry.
                user.EmailVerificationCode = verificationCode;
                user.EmailVerificationExpiry = DateTime.UtcNow.AddHours(1);

                await _userManager.UpdateAsync(user);

                // Send verification email.
                await SendVerificationEmail(user.Email, verificationCode);

                return Ok(new
                    { Message = "Registration successful. Verification code sent to email.", userId = user.Id });
            }

            // Map error codes (note: removed username-related messages).
            var errorMessages = result.Errors.Select(e => MapIdentityErrorCodeToMessage(e.Code)).ToArray();
            _logger.LogWarning("Error creating user: {Errors}", string.Join("; ", errorMessages));
            return BadRequest(new { errors = errorMessages });
        }

        // Helper method to map Identity error codes to custom messages.
        private string MapIdentityErrorCodeToMessage(string errorCode)
        {
            switch (errorCode)
            {
                case "PasswordTooShort":
                case "PasswordRequiresNonAlphanumeric":
                case "PasswordRequiresDigit":
                case "PasswordRequiresUpper":
                case "PasswordRequiresLower":
                    return
                        "Password should contain at least 6 characters, one uppercase letter, one digit & one special character.";
                // Removed DuplicateUserName and InvalidUserName cases.
                case "DuplicateEmail":
                    return "Email is already taken. Try logging in.";
                case "InvalidEmail":
                    return "Email is invalid.";
                default:
                    return "An error occurred during registration.";
            }
        }

        private async Task SendVerificationEmail(string email, string verificationCode)
        {
            var apiKey = _configuration["SendGrid:ApiKey"];
            var client = new SendGridClient(apiKey);
            var from = new EmailAddress("admin@anthra.dk", "Anthra");
            var to = new EmailAddress(email);
            var subject = "Email Verification Code";
            var plainTextContent = $"Welcome to Anthra 🎉! Your email verification code is: {verificationCode}";
            var htmlContent =
                $"Welcome to Anthra 🎉! <br> <p>Your email verification code is: <strong>{verificationCode}</strong></p>";
            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
            await client.SendEmailAsync(msg);
        }

        [HttpPost("VerifyEmail")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailViewModel model)
        {
            var user = await _userManager.FindByIdAsync(model.UserId);
            if (user == null)
            {
                return BadRequest("User not found.");
            }

            if (user.EmailVerificationCode != model.Code || user.EmailVerificationExpiry < DateTime.UtcNow)
            {
                return BadRequest("Invalid or expired verification code.");
            }

            user.EmailConfirmed = true;
            user.EmailVerificationCode = null;
            user.EmailVerificationExpiry = null;

            await _userManager.UpdateAsync(user);

            var token = GenerateJwtToken(user);
            return Ok(new
            {
                Message = "Email verified successfully", userId = user.Id, token,
                fullName = user.FirstName + " " + user.LastName
            });
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginViewModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Since username is no longer used, look up the user by email.
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return Unauthorized("Invalid email or password.");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, lockoutOnFailure: false);


            if (result.Succeeded)
            {
                if (!user.EmailConfirmed)
                {
                    return BadRequest("Email not verified.");
                }

                var token = GenerateJwtToken(user);
                // Note: We no longer return userName in the response.
                return Ok(new
                {
                    Message = "Login successful", userId = user.Id, token,
                    fullName = user.FirstName + " " + user.LastName
                });
            }

            return Unauthorized("Invalid email or password.");
        }

        private string GenerateJwtToken(ApplicationUser user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSettings["Secret"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Note: The claim for UniqueName (username) has been removed.
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
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

        [HttpPost("ResendVerificationCode")]
        public async Task<IActionResult> ResendVerificationCode([FromBody] ResendVerificationCodeViewModel model)
        {
            var user = await _userManager.FindByIdAsync(model.UserId);
            if (user == null)
            {
                return BadRequest("User not found.");
            }

            var verificationCode = new Random().Next(100000, 999999).ToString();
            user.EmailVerificationCode = verificationCode;
            user.EmailVerificationExpiry = DateTime.UtcNow.AddHours(1);
            await _userManager.UpdateAsync(user);

            await SendVerificationEmail(user.Email, verificationCode);
            return Ok("Verification code resent.");
        }

        public class VerifyEmailViewModel
        {
            public string UserId { get; set; }
            public string Code { get; set; }
        }

        public class ResendVerificationCodeViewModel
        {
            public string UserId { get; set; }
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

            var signInResult =
                await _signInManager.ExternalLoginSignInAsync(info.LoginProvider, info.ProviderKey,
                    isPersistent: false);

            if (signInResult.Succeeded)
            {
                // User logged in with external provider.
                var user = await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
                var token = GenerateJwtToken(user);
                return Redirect($"{returnUrl}?token={token}&userId={user.Id}");
            }
            else
            {
                // If the user does not have an account, create one using the email only.
                var email = info.Principal.FindFirstValue(ClaimTypes.Email);
                var user = new ApplicationUser
                {
                    // Again, set UserName automatically to email.
                    UserName = email,
                    Email = email
                };

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

            // Generate reset code.
            var resetCode = new Random().Next(100000, 999999).ToString();

            // Set code and expiry.
            user.PasswordResetCode = resetCode;
            user.PasswordResetExpiry = DateTime.UtcNow.AddHours(1);

            await _userManager.UpdateAsync(user);

            // Send email using SendGrid.
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
                var from = new EmailAddress(fromEmail, "Anthra");
                var to = new EmailAddress(model.Email);
                var subject = "Password Reset Code";
                var plainTextContent = $"Your password reset code is: {resetCode}";
                var htmlContent =
                    $"<p>Happens to the best of us 😉 <br> Your password reset code is: <strong>{resetCode}</strong></p>";
                var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);

                var response = await client.SendEmailAsync(msg);
                var responseBody = await response.Body.ReadAsStringAsync();

                if (response.StatusCode != System.Net.HttpStatusCode.Accepted)
                {
                    _logger.LogError("Failed to send email via SendGrid: {StatusCode} - {ResponseBody}",
                        response.StatusCode, responseBody);
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
                // Clear reset code and expiry.
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