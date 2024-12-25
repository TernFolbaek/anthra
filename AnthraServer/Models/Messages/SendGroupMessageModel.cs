using MyBackendApp.Attributes;

public class SendGroupMessageModel
{
    public string SenderId { get; set; }
    public int GroupId { get; set; }
    [RequiredIfNoFile("File", ErrorMessage = "Either provide content or attach a file.")]

    public string? Content { get; set; }
    public IFormFile? File { get; set; }
}