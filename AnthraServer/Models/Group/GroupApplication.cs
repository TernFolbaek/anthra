// Models/GroupApplicationRequest.cs

using MyBackendApp.Models;

public class GroupApplicationRequest
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public string ApplicantId { get; set; }
    public string AdminId { get; set; }
    public DateTime RequestedAt { get; set; }
    public bool IsAccepted { get; set; }
    public bool IsDeclined { get; set; }


    public ApplicationUser Applicant { get; set; }
    public ApplicationUser Admin { get; set; }
    public Group Group { get; set; }
}