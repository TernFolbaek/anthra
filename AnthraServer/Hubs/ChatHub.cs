using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using MyBackendApp.Data;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace MyBackendApp.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;

        public ChatHub(ApplicationDbContext context)
        {
            _context = context;
        }

        // Called when a client connects to the hub
        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;

            // Ensure user is authenticated
            if (string.IsNullOrEmpty(userId))
            {
                await base.OnConnectedAsync();
                return;
            }

            // Add user to all groups they are a member of
            var groupIds = await _context.GroupMembers
                .Where(gm => gm.UserId == userId)
                .Select(gm => gm.GroupId)
                .ToListAsync();

            foreach (var groupId in groupIds)
            {
                var groupName = $"Group_{groupId}";
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            }

            await base.OnConnectedAsync();
        }

        // Send a direct message to a specific user
        public async Task SendDirectMessage(string receiverId, string content)
        {
            var senderId = Context.UserIdentifier;
            var groupId = GetChatGroupId(senderId, receiverId);

            // Optionally, save the message to the database here

            await Clients.Group(groupId).SendAsync("ReceiveMessage", new
            {
                Id = 0, // Replace with actual message ID if saved to DB
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = content,
                Timestamp = DateTime.UtcNow
            });
        }

        // Send a message to a group
        public async Task SendGroupMessage(int groupId, string content)
        {
            var senderId = Context.UserIdentifier;
            var groupName = $"Group_{groupId}";

            // Optionally, save the message to the database here

            await Clients.Group(groupName).SendAsync("ReceiveGroupMessage", new
            {
                Id = 0, // Replace with actual message ID if saved to DB
                SenderId = senderId,
                GroupId = groupId,
                Content = content,
                Timestamp = DateTime.UtcNow
            });
        }

        // Join a specific group
        public async Task JoinGroup(string groupId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupId);
        }

        // Leave a specific group
        public async Task LeaveGroup(string groupId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId);
        }

        // Helper method to get a unique group name for a direct chat between two users
        private string GetChatGroupId(string userA, string userB)
        {
            return string.CompareOrdinal(userA, userB) < 0 ? $"{userA}-{userB}" : $"{userB}-{userA}";
        }
    }
}
