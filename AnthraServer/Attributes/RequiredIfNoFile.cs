using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace MyBackendApp.Attributes
{
    /// <summary>
    /// Validates that a string property is required only if another IFormFile property is null or empty.
    /// Usage: [RequiredIfNoFile("File", ErrorMessage = "Either provide content or attach a file.")]
    /// </summary>
    [AttributeUsage(AttributeTargets.Property)]
    public class RequiredIfNoFileAttribute : ValidationAttribute
    {
        private readonly string _filePropertyName;

        public RequiredIfNoFileAttribute(string filePropertyName)
        {
            _filePropertyName = filePropertyName;
        }

        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            // 'value' is the value of the property on which this attribute is placed (i.e., 'Content')
            var contentValue = value as string;

            // Get the 'File' property by reflection
            var fileProperty = validationContext.ObjectType.GetProperty(_filePropertyName);
            if (fileProperty == null)
            {
                return new ValidationResult($"Unknown property '{_filePropertyName}'");
            }

            // Get the actual file value (should be of type IFormFile)
            var fileValue = fileProperty.GetValue(validationContext.ObjectInstance) as IFormFile;

            // If there's no file, we require content.
            if (fileValue == null || fileValue.Length == 0)
            {
                if (string.IsNullOrWhiteSpace(contentValue))
                {
                    // Return the custom error message or a default
                    return new ValidationResult(ErrorMessage ?? "Content is required if File is not provided.");
                }
            }

            // Otherwise, validation succeeds
            return ValidationResult.Success;
        }
    }
}