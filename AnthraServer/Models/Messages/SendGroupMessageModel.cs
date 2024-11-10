public class SendGroupMessageModel
{
    public string SenderId { get; set; }
    public int GroupId { get; set; }
    public string Content { get; set; }
    public IFormFile? File { get; set; }
}