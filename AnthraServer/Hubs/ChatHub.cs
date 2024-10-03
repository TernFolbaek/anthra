using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace MyBackendApp.Hubs
{
    public class ChatHub : Hub
    {
        public async Task SendMessage(string groupId, object message)
        {
            await Clients.Group(groupId).SendAsync("ReceiveMessage", message);
        }

        public async Task JoinGroup(string groupId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupId);
        }

        public async Task LeaveGroup(string groupId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId);
        }
    }
}