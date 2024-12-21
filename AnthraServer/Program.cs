using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MyBackendApp.Data;
using MyBackendApp.Hubs;
using MyBackendApp.Models;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure Entity Framework and PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add SignalR
builder.Services.AddSignalR();

// Configure Identity with options
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.User.RequireUniqueEmail = true; 
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.ASCII.GetBytes(jwtSettings["Secret"]);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
// JWT Bearer Authentication
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Set to true in production
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };

    // Configure SignalR authentication
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];

            // If the request is for our hubs...
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) &&
                (path.StartsWithSegments("/chatHub")
                 || path.StartsWithSegments("/notificationHub")))
            {
                // Read the token out of the query string
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
})
// Google Authentication
.AddGoogle(options =>
{
    options.ClientId = builder.Configuration["Authentication:Google:ClientId"];
    options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "https://countriesnow.space")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

// Configure Cookie settings
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Unspecified; // Allows cross-site cookies over HTTP
    options.Cookie.SecurePolicy = CookieSecurePolicy.None; // Allow cookies over HTTP
});

// Configure JSON options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

var app = builder.Build();

// Apply migrations (if needed)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();
}

// Configure the HTTP request pipeline
app.UseCors("AllowSpecificOrigin");

app.UseExceptionHandler(a => a.Run(async context =>
{
    var exception = context.Features.Get<IExceptionHandlerPathFeature>()?.Error;
    var result = JsonSerializer.Serialize(new
    {
        error = exception?.Message,
        stackTrace = exception?.StackTrace // Include stack trace
    });
    context.Response.ContentType = "application/json";
    context.Response.StatusCode = 500;
    await context.Response.WriteAsync(result);
}));

app.Use(async (context, next) =>
{
    context.Response.Headers.Add("Cross-Origin-Opener-Policy", "same-origin");
    context.Response.Headers.Add("Cross-Origin-Embedder-Policy", "require-corp");
    await next();
});

app.UseStaticFiles();
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/chatHub");
app.MapHub<NotificationHub>("/notificationHub");

if (app.Environment.IsDevelopment())
{
    app.MapPost("/create-test-users", async (ApplicationDbContext db, UserManager<ApplicationUser> userManager) =>
    {
        var testUsers = new List<ApplicationUser>
        {
            new ApplicationUser 
            { 
                UserName = "tern", 
                Email = "test1@example.com", 
                FirstName = "Tern", 
                LastName = "Folbaek", 
                Location = "Copenhagen, Denmark", 
                Age = 25, 
                Institution = "University of Copenhagen", 
                Work = "Student Researcher", 
                Courses = new List<Course> 
                {
                    new Course { CourseName = "Quantum Physics", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                    new Course { CourseName = "Advanced Algorithms", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
                }, 
                Subjects = new List<string> { "Physics", "Mathematics", "Computer Science" },
                Statuses = new List<string> { "✎ exam preparations", "☺ expanding my network", "☏ looking for collaboration" },
                AboutMe = "I am a passionate researcher exploring the intersections of quantum mechanics and computational algorithms. Always eager to connect with like-minded peers.",
                CreatedProfile = true,
                ProfileCompleted = true,
                EmailConfirmed = true,
                ProfilePictureUrl = "https://anthra.blob.core.windows.net/profile-pictures/1d64e0db-c039-400c-8498-a3d8c4b6a72a_638695123408959910.jpeg?sv=2022-11-02&ss=bfqt&srt=sco&spr=https&st=2024-10-01T08%3A15%3A49Z&se=2026-10-01T16%3A15%3A49Z&sp=rwdlacupiytfx&sig=SHmifWmLLf50pO0nqEVnIBYTqRx0QHmJpS5iAiYXq%2F0%3D"
            },
            new ApplicationUser 
            { 
                UserName = "gab", 
                Email = "test2@example.com", 
                FirstName = "Gab", 
                LastName = "Smith", 
                Location = "New York, USA", 
                Age = 22, 
                Institution = "Columbia University", 
                Work = "Teaching Assistant", 
                Courses = new List<Course> 
                {
                    new Course { CourseName = "Data Structures", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                    new Course { CourseName = "Machine Learning", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
                }, 
                Subjects = new List<string> { "Computer Science", "Data Science" },
                Statuses = new List<string> { "✎ exam preparations", "☺ expanding my network", "☏ looking for collaboration" },
                AboutMe = "Mentoring students and pursuing data science passionately. Enjoy solving real-world problems through ML.",
                CreatedProfile = true,
                ProfileCompleted = true,
                EmailConfirmed = true,
                ProfilePictureUrl = "https://anthra.blob.core.windows.net/profile-pictures/e5cfb40d-c7c2-4b8c-afd3-d2f733951de4_638696439327625580.jpeg?sv=2022-11-02&ss=bfqt&srt=sco&spr=https&st=2024-10-01T08%3A15%3A49Z&se=2026-10-01T16%3A15%3A49Z&sp=rwdlacupiytfx&sig=SHmifWmLLf50pO0nqEVnIBYTqRx0QHmJpS5iAiYXq%2F0%3D"
            },
            new ApplicationUser 
            { 
                UserName = "justin", 
                Email = "test3@example.com", 
                FirstName = "Justin", 
                LastName = "Lee", 
                Location = "Toronto, Canada", 
                Age = 24, 
                Institution = "University of Toronto", 
                Work = "Intern", 
                Courses = new List<Course> 
                {
                    new Course { CourseName = "Web Development", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                    new Course { CourseName = "Cloud Computing", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
                }, 
                Subjects = new List<string> { "Software Engineering", "Cloud Computing" },
                Statuses = new List<string> { "✎ exam preparations", "☺ expanding my network", "☏ looking for collaboration" },
                AboutMe = "Enthusiast for web apps and cloud solutions. Currently gaining hands-on experience.",
                CreatedProfile = true,
                ProfileCompleted = true,
                EmailConfirmed = true,
                ProfilePictureUrl = "https://anthra.blob.core.windows.net/profile-pictures/846e3f55-8020-46a2-8c73-efb3c9a3d03d_638696463611202980.jpg?sv=2022-11-02&ss=bfqt&srt=sco&spr=https&st=2024-10-01T08%3A15%3A49Z&se=2026-10-01T16%3A15%3A49Z&sp=rwdlacupiytfx&sig=SHmifWmLLf50pO0nqEVnIBYTqRx0QHmJpS5iAiYXq%2F0%3D"
            },
            new ApplicationUser 
            { 
                UserName = "birkk", 
                Email = "test4@example.com", 
                FirstName = "Birk", 
                LastName = "Andersen", 
                Location = "Oslo, Norway", 
                Age = 26, 
                Institution = "Norwegian University of Science and Technology", 
                Work = "Research Assistant", 
                Courses = new List<Course> 
                {
                    new Course { CourseName = "Artificial Intelligence", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                    new Course { CourseName = "Neural Networks", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
                }, 
                Subjects = new List<string> { "AI", "Neuroscience", "Computer Science" },
                Statuses = new List<string> { "✎ exam preparations", "☺ expanding my network", "☏ looking for collaboration" },
                AboutMe = "Researching AI and neural networks to understand human cognition.",
                CreatedProfile = true,
                ProfileCompleted = true,
                EmailConfirmed = true,
                ProfilePictureUrl = "https://anthra.blob.core.windows.net/profile-pictures/14ae8105-3d80-460a-a1f2-c3beef976bf2_638696440832626590.jpg?sv=2022-11-02&ss=bfqt&srt=sco&spr=https&st=2024-10-01T08%3A15%3A49Z&se=2026-10-01T16%3A15%3A49Z&sp=rwdlacupiytfx&sig=SHmifWmLLf50pO0nqEVnIBYTqRx0QHmJpS5iAiYXq%2F0%3D"
            },
            new ApplicationUser 
            { 
                UserName = "andreas", 
                Email = "test5@example.com", 
                FirstName = "Andreas", 
                LastName = "Johansson", 
                Location = "Stockholm, Sweden", 
                Age = 23, 
                Institution = "KTH Royal Institute of Technology", 
                Work = "Freelance Developer", 
                Courses = new List<Course> 
                {
                    new Course { CourseName = "Mobile App Development", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                    new Course { CourseName = "Cybersecurity", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
                }, 
                Subjects = new List<string> { "Mobile Development", "Cybersecurity" },
                Statuses = new List<string> { "✎ exam preparations", "☺ expanding my network", "☏ looking for collaboration" },
                AboutMe = "Building secure mobile apps as a freelancer. Always exploring new tech trends.",
                CreatedProfile = true,
                ProfileCompleted = true,
                EmailConfirmed = true,
                ProfilePictureUrl = "https://anthra.blob.core.windows.net/profile-pictures/14074ea9-e7d2-484a-b2fa-b39b07e56a20_638696441434379230.jpg?sv=2022-11-02&ss=bfqt&srt=sco&spr=https&st=2024-10-01T08%3A15%3A49Z&se=2026-10-01T16%3A15%3A49Z&sp=rwdlacupiytfx&sig=SHmifWmLLf50pO0nqEVnIBYTqRx0QHmJpS5iAiYXq%2F0%3D" 
            },
            new ApplicationUser 
            { 
                UserName = "carsten", 
                Email = "test6@example.com", 
                FirstName = "Carsten", 
                LastName = "Folbaek", 
                Location = "Stockholm, Sweden", 
                Age = 23, 
                Institution = "KTH Royal Institute of Technology", 
                Work = "Freelance Developer", 
                Courses = new List<Course> 
                {
                    new Course { CourseName = "Mobile App Development", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                    new Course { CourseName = "Cybersecurity", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                    new Course { CourseName = "Mobile App Development", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                    new Course { CourseName = "App Development", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                }, 
                Subjects = new List<string> { "Mobile Development", "Cybersecurity" },
                Statuses = new List<string> { "examp prepping", "on exchange", "official exchange" },
                AboutMe = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor...",
                CreatedProfile = true,
                ProfileCompleted = true,
                EmailConfirmed = true,
                ProfilePictureUrl = "https://anthra.blob.core.windows.net/profile-pictures/d1ce40a4-fb10-41d7-ae72-0e1addde8756_638696442365304750.avif?sv=2022-11-02&ss=bfqt&srt=sco&spr=https&st=2024-10-01T08%3A15%3A49Z&se=2026-10-01T16%3A15%3A49Z&sp=rwdlacupiytfx&sig=SHmifWmLLf50pO0nqEVnIBYTqRx0QHmJpS5iAiYXq%2F0%3D" 
            },
            new ApplicationUser 
            { 
                UserName = "thomas", 
                Email = "test7@example.com", 
                FirstName = "Thomas", 
                LastName = "Johansen", 
                Location = "Rio, Brazil", 
                Age = 33, 
                Institution = "KTH Royal Institute of Technology", 
                Work = "Freelance Developer", 
                Courses = new List<Course> 
                {
                    new Course { CourseName = "Mobile App Development", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                    new Course { CourseName = "Cybersecurity", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                    new Course { CourseName = "Mobile App Development", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                    new Course { CourseName = "App Development", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                }, 
                Subjects = new List<string> { "Mobile Development", "Cybersecurity" },
                Statuses = new List<string> { "examp prepping", "on exchange", "official exchange" },
                AboutMe = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor",
                CreatedProfile = true,
                ProfileCompleted = true,
                EmailConfirmed = true,
                ProfilePictureUrl = "https://anthra.blob.core.windows.net/profile-pictures/d1ce40a4-fb10-41d7-ae72-0e1addde8756_638696442365304750.avif?sv=2022-11-02&ss=bfqt&srt=sco&spr=https&st=2024-10-01T08%3A15%3A49Z&se=2026-10-01T16%3A15%3A49Z&sp=rwdlacupiytfx&sig=SHmifWmLLf50pO0nqEVnIBYTqRx0QHmJpS5iAiYXq%2F0%3D" 
            }
            
        };

        // Create the test users
        foreach (var user in testUsers)
        {
            await userManager.CreateAsync(user, "Tern2004!!");
        }

        // Retrieve the newly created users
        var ternUser = await userManager.FindByNameAsync("tern");
        var gabUser = await userManager.FindByNameAsync("gab");
        var justinUser = await userManager.FindByNameAsync("justin");
        var andreasUser = await userManager.FindByNameAsync("andreas");
        var birkkUser = await userManager.FindByNameAsync("birkk");
        var carstenUser = await userManager.FindByNameAsync("carsten");
        var thomasUser = await userManager.FindByNameAsync("thomas");



        // Create 3 seed groups
        var group1 = new Group
        {
            Name = "Quantum Explorers",
            adminName = ternUser.UserName,
            GroupDescription = "Discussing advanced quantum physics and related research.",
            GroupMemberDesire = "Open to researchers and students interested in quantum mechanics.",
            GroupPurpose = "Social",
            isPublic = true,
            CreatorId = ternUser.Id
        };

        var group2 = new Group
        {
            Name = "Data Science Innovators",
            adminName = gabUser.UserName,
            GroupDescription = "Exploring cutting-edge data science tools and techniques.",
            GroupMemberDesire = "Open to data enthusiasts and ML engineers.",
            GroupPurpose = "General",
            isPublic = true,
            CreatorId = gabUser.Id
        };

        var group3 = new Group
        {
            Name = "Cloud Builders",
            adminName = justinUser.UserName,
            GroupDescription = "Focusing on cloud computing best practices and architecture.",
            GroupMemberDesire = "Cloud developers and architects welcome.",
            GroupPurpose = "Exam Preparation",
            isPublic = true,
            CreatorId = justinUser.Id
        };

        // Add groups to the database
        db.Groups.AddRange(group1, group2, group3);
        await db.SaveChangesAsync();

        // Add the creators as members of their own groups
        db.Set<GroupMember>().AddRange(
            new GroupMember { GroupId = group1.Id, UserId = ternUser.Id, IsAccepted = true },
            new GroupMember { GroupId = group1.Id, UserId = gabUser.Id, IsAccepted = true },
            new GroupMember { GroupId = group1.Id, UserId = justinUser.Id, IsAccepted = true },
            new GroupMember { GroupId = group1.Id, UserId = carstenUser.Id, IsAccepted = true },
            new GroupMember { GroupId = group1.Id, UserId = birkkUser.Id, IsAccepted = true },
            new GroupMember { GroupId = group1.Id, UserId = andreasUser.Id, IsAccepted = true },
            new GroupMember { GroupId = group1.Id, UserId = thomasUser.Id, IsAccepted = true },



            new GroupMember { GroupId = group2.Id, UserId = gabUser.Id, IsAccepted = true },
            new GroupMember { GroupId = group2.Id, UserId = ternUser.Id, IsAccepted = true },

            new GroupMember { GroupId = group3.Id, UserId = justinUser.Id, IsAccepted = true },
            new GroupMember { GroupId = group3.Id, UserId = ternUser.Id, IsAccepted = true },
            new GroupMember { GroupId = group3.Id, UserId = gabUser.Id, IsAccepted = true }

        );
        await db.SaveChangesAsync();

        return Results.Ok("6 test users and 3 seed groups created.");
    });

    app.MapPost("/delete-test-users", async (ApplicationDbContext db) =>
    {
        var testUsers = await db.Users.Where(u => u.UserName == "tern" || u.UserName == "gab" || u.UserName == "justin" || u.UserName == "birkk" || u.UserName == "andreas" || u.UserName == "carsten").ToListAsync();
        db.Users.RemoveRange(testUsers);
        await db.SaveChangesAsync();

        return Results.Ok("Test users deleted.");
    });
}



// Run the app on http://localhost:5001
app.Urls.Add("http://*:5001");

app.Run();
