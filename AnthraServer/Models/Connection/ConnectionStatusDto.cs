namespace MyBackendApp.ViewModels
{
    public class ConnectionStatusDto
       {
           public string TargetUserId { get; set; }
           public bool IsConnected { get; set; }
           public bool RequestPending { get; set; }
           public bool HasUserAcceptedRequest { get; set; }
           public bool HasUserSentRequest { get; set; }
       }
}