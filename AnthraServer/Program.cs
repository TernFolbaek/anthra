using System.Net;
using System.Security.Cryptography.X509Certificates;
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


// Adjust CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        policy =>
        {
            policy.WithOrigins(
                    "https://anthra.dk", "http://localhost:3000", 
                    "http://localhost:80", "http://localhost")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
});


builder.WebHost.ConfigureKestrel(options =>
{
    options.Listen(IPAddress.Any, 5000); 
});

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
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = true; // Enforce HTTPS in production
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


// Configure Cookie settings
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.None; // Allows cross-site cookies over HTTP
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest; // Allow cookies over HTTP
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

// Enforce HTTPS Redirection
app.UseHttpsRedirection();

app.UseCors("AllowSpecificOrigin");

app.UseExceptionHandler(a => a.Run(async context =>
{
    var origin = context.Request.Headers["Origin"].ToString();
    var allowedOrigins = new List<string> { "https://anthra.dk", "http://localhost:3000" };

    if (allowedOrigins.Contains(origin))
    {
        context.Response.Headers.Add("Access-Control-Allow-Origin", origin);
        context.Response.Headers.Add("Access-Control-Allow-Credentials", "true");
    }

    var exception = context.Features.Get<IExceptionHandlerPathFeature>()?.Error;
    var result = JsonSerializer.Serialize(new
    {
        error = exception?.Message,
        stackTrace = app.Environment.IsDevelopment() ? exception?.StackTrace : null
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
                Statuses = new List<string> { "✎ exam preparations", "☺ grow network", "☏ looking for collaboration" },
                AboutMe = "I am a passionate researcher exploring the intersections of quantum mechanics and computational algorithms. Always eager to connect with like-minded peers. I am a passionate researcher exploring the intersections of quantum mechanics and computational algorithms. ",
                CreatedProfile = true,
                ProfileCompleted = true,
                EmailConfirmed = true,
                ProfilePictureUrl = "https://anthra.blob.core.windows.net/profile-pictures/Screenshot 2025-02-01 at 22.13.56.png" 
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
                Statuses = new List<string> { "✎ exam preparations", "☺ grow network", "☏ looking for collaboration" },
                AboutMe = "Mentoring students and pursuing data science passionately. Enjoy solving real-world problems through ML. Mentoring students and pursuing data science passionately. Enjoy solving real-world problems through ML.",
                CreatedProfile = true,
                ProfileCompleted = true,
                EmailConfirmed = true,
                ProfilePictureUrl = "https://anthra.blob.core.windows.net/profile-pictures/Screenshot 2025-02-01 at 22.12.53.png" 
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
                Statuses = new List<string> { "✎ exam preparations", "☺ grow network", "☏ looking for collaboration" },
                AboutMe = "Enthusiast for web apps and cloud solutions. Currently gaining hands-on experience. Mentoring students and pursuing data science passionately. Enjoy solving real-world problems through ML.",
                CreatedProfile = true,
                ProfileCompleted = true,
                EmailConfirmed = true,
                ProfilePictureUrl = "https://anthra.blob.core.windows.net/profile-pictures/Screenshot 2025-02-01 at 22.14.40.png" 
            },
            new ApplicationUser 
            { 
                UserName = "birkk", 
                Email = "test4@example.com", 
                FirstName = "Sophie", 
                LastName = "Jebsen", 
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
                Statuses = new List<string> { "✎ exam preparations", "☺ grow network", "☏ looking for collaboration" },
                AboutMe = "Researching AI and neural networks to understand human cognition. Mentoring students and pursuing data science passionately. Enjoy solving real-world problems through ML. Mentoring students and pursuing data science passionately. Enjoy solving real-world problems through ML.",
                CreatedProfile = true,
                ProfileCompleted = true,
                EmailConfirmed = true,
                ProfilePictureUrl = "https://anthra.blob.core.windows.net/profile-pictures/Screenshot 2025-02-01 at 22.15.48.png" 
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
                Statuses = new List<string> { "✎ exam preparations", "☺ grow network", "☏ looking for collaboration" },
                AboutMe = "Building secure mobile apps as a freelancer. Always exploring new tech trends. Mentoring students and pursuing data science passionately. Enjoy solving real-world problems through ML. Mentoring students and pursuing data science passionately. Enjoy solving real-world problems through ML.",
                CreatedProfile = true,
                ProfileCompleted = true,
                EmailConfirmed = true,
                ProfilePictureUrl = "https://anthra.blob.core.windows.net/profile-pictures/Screenshot 2025-02-01 at 22.16.56.png" 
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
                AboutMe = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Mentoring students and pursuing data science passionately. Enjoy solving real-world problems through ML. Mentoring students and pursuing data science passionately. Enjoy solving real-world problems through ML.",
                CreatedProfile = true,
                ProfileCompleted = true,
                EmailConfirmed = true,
                ProfilePictureUrl = "https://anthra.blob.core.windows.net/profile-pictures/Screenshot 2025-02-01 at 22.17.49.png" 
            },
            new ApplicationUser 
            { 
                UserName = "thomas", 
                Email = "test7@example.com", 
                FirstName = "Marie", 
                LastName = "Johansen", 
                Location = "Østerbro, Danmark", 
                Age = 23, 
                Institution = "Københavns Universitet", 
                Work = "Juridisk Assistent", 
                Courses = new List<Course> 
                {
                    new Course { CourseName = "Intro til dansk lovgivning", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                    new Course { CourseName = "Forfatningsret og erstatningsret", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                    new Course { CourseName = "Obligationsret (Kontrakt- og Erstatningsret)", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                    new Course { CourseName = "Ugyldighedsgrunde", CourseLink = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                }, 
                Subjects = new List<string> { "Klatring", "Latte Art", "Vandrer" },
                Statuses = new List<string> { "examp prepping", "on exchange", "official exchange" },
                AboutMe = "\"Jeg hedder Marie og studerer jura på Københavns Universitet. Til daglig arbejder jeg som juridisk assistent. Elsker klatring, latte art og vandring! På udveksling og fordyber mig i dansk lovgivning. Ville elske at dele mine juridiske noter med andre ahahaha",
                CreatedProfile = true,
                ProfileCompleted = true,
                EmailConfirmed = true,
                ProfilePictureUrl = "https://anthra.blob.core.windows.net/profile-pictures/Screenshot 2025-02-01 at 22.18.41.png" 
            }
            
        };

        // Create the test users
        foreach (var user in testUsers)
        {
            await userManager.CreateAsync(user, "Tern2004!!");
        }

        // Retrieve the newly created users by their unique email addresses
        var thomasUser = await userManager.FindByEmailAsync("test7@example.com"); // Marie (formerly "thomas" as UserName)
        var ternUser = await userManager.FindByEmailAsync("test1@example.com");
        var gabUser = await userManager.FindByEmailAsync("test2@example.com");
        var justinUser = await userManager.FindByEmailAsync("test3@example.com");
        var andreasUser = await userManager.FindByEmailAsync("test5@example.com");
        var birkkUser = await userManager.FindByEmailAsync("test4@example.com");
        var carstenUser = await userManager.FindByEmailAsync("test6@example.com");




        // Create 3 seed groups
      var group1 = new Group
{
    Name = "Quantum Explorers",
    adminName = ternUser.FirstName,
    GroupDescription = "Discussing advanced quantum physics and related research. Join us for bi-weekly discussions on groundbreaking quantum discoveries.",
    GroupMemberDesire = "Open to researchers and students interested in quantum mechanics. Members should be excited to challenge conventional theories.",
    GroupPurpose = "Social",
    isPublic = true,
    CreatorId = ternUser.Id
};

var group2 = new Group
{
    Name = "Data Science Innovators",
    adminName = gabUser.FirstName,
    GroupDescription = "Exploring cutting-edge data science tools and techniques. Our regular meet-ups encourage collaborative innovation in data analysis.",
    GroupMemberDesire = "Open to data enthusiasts and ML engineers. Candidates must be eager to dive into complex data challenges.",
    GroupPurpose = "General",
    isPublic = true,
    CreatorId = gabUser.Id
};

var group3 = new Group
{
    Name = "Cloud Builders",
    adminName = justinUser.FirstName,
    GroupDescription = "Focusing on cloud computing best practices and architecture. Discussions include real-world cloud deployment challenges.",
    GroupMemberDesire = "Cloud developers and architects welcome. Members are encouraged to share innovative cloud solutions.",
    GroupPurpose = "Exam Preparation",
    isPublic = true,
    CreatorId = justinUser.Id
};

var group4 = new Group
{
    Name = "Math Olympiads",
    adminName = justinUser.FirstName,
    GroupDescription = "Focusing on cloud computing best practices and architecture. We also emphasize advanced problem-solving techniques for competitive mathematics.",
    GroupMemberDesire = "Cloud developers and architects welcome. Contestants with a passion for rigorous mathematical challenges are invited.",
    GroupPurpose = "Exam Preparation",
    isPublic = true,
    CreatorId = justinUser.Id
};

var group5 = new Group
{
    Name = "Physics Olympiads",
    adminName = justinUser.FirstName,
    GroupDescription = "Focusing on cloud computing best practices and architecture. Our sessions further explore experimental methods and theoretical physics puzzles.",
    GroupMemberDesire = "Cloud developers and architects welcome. Members must show a genuine passion for unraveling physics complexities.",
    GroupPurpose = "Exam Preparation",
    isPublic = true,
    CreatorId = justinUser.Id
};

var group6 = new Group
{
    Name = "Cybersecurity Olympiads",
    adminName = justinUser.FirstName,
    GroupDescription = "Focusing on cloud computing best practices and architecture. We also incorporate discussions on emerging cybersecurity trends.",
    GroupMemberDesire = "Cloud developers and architects welcome. Members should be motivated to explore innovative solutions in digital security.",
    GroupPurpose = "Exam Preparation",
    isPublic = true,
    CreatorId = justinUser.Id
};


        // Add groups to the database
        db.Groups.AddRange(group1, group2, group3, group4, group5, group6);
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
            new GroupMember { GroupId = group3.Id, UserId = gabUser.Id, IsAccepted = true },
            
            new GroupMember { GroupId = group4.Id, UserId = justinUser.Id, IsAccepted = true },
            new GroupMember { GroupId = group4.Id, UserId = gabUser.Id, IsAccepted = true },

            new GroupMember { GroupId = group5.Id, UserId = justinUser.Id, IsAccepted = true },
            new GroupMember { GroupId = group5.Id, UserId = gabUser.Id, IsAccepted = true },
                
            new GroupMember { GroupId = group6.Id, UserId = andreasUser.Id, IsAccepted = true },
            new GroupMember { GroupId = group6.Id, UserId = gabUser.Id, IsAccepted = true }
            
        );
        await db.SaveChangesAsync();

        return Results.Ok("6 test users and 3 seed groups created.");
    });

    app.MapPost("/delete-test-users", async (ApplicationDbContext db) =>
    {
        var testUsers = await db.Users.Where(u => u.FirstName == "Marie" || u.FirstName == "Carsten" || u.FirstName == "Andreas" || u.FirstName == "Birk" || u.FirstName == "Justin" || u.FirstName == "Gab" || u.FirstName == "Tern").ToListAsync();
        db.Users.RemoveRange(testUsers);
        await db.SaveChangesAsync();

        return Results.Ok("Test users deleted.");
    });
}


app.Run();
