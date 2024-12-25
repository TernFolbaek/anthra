using System;
using System.ComponentModel.DataAnnotations;

namespace MyBackendApp.Attributes
{
    /// <summary>
    /// Ensures that the Content property is required only when there is no Attachment.
    /// If Attachment != null, Content is optional.
    /// </summary>
    [AttributeUsage(AttributeTargets.Property, AllowMultiple = false)]
    public class RequiredIfNoAttachmentAttribute : ValidationAttribute
    {
        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            // The validation context's ObjectInstance should be our Message model
            var message = validationContext.ObjectInstance as MyBackendApp.Models.Message;
            if (message == null)
            {
                // If we can't cast, return success so we don't break other scenarios
                return ValidationResult.Success;
            }

            // If there's no attachment
            bool hasNoAttachment = (message.Attachment == null);

            // value = Content property (which can be null or empty)
            var contentString = value as string;

            // If there's no attachment AND content is null/empty => Validation error
            if (hasNoAttachment && string.IsNullOrWhiteSpace(contentString))
            {
                // Use the provided ErrorMessage or fall back to a default
                return new ValidationResult(ErrorMessage ?? "Content is required if no attachment is provided.");
            }

            // Otherwise it's valid
            return ValidationResult.Success;
        }
    }
}