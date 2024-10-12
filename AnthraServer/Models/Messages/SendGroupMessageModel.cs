using System.ComponentModel.DataAnnotations;

namespace MyBackendApp.ViewModels
{
    public class SendGroupMessageModel
    {
        [Required]
        public int GroupId { get; set; }

        [Required]
        public string SenderId { get; set; }

        [Required]
        public string Content { get; set; }
    }
}