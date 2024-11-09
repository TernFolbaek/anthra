using System.ComponentModel.DataAnnotations;

namespace MyBackendApp.Models
{
    public class Attachment
    {
        public int Id { get; set; }
        public string FileName { get; set; }
        public string FileUrl { get; set; }

        // Relationships
        public int? MessageId { get; set; }
        public Message Message { get; set; }

        public int? GroupMessageId { get; set; }
        public GroupMessage GroupMessage { get; set; }
    }

}