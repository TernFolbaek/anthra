# Use the .NET 8.0 SDK image for building the application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /app

# Copy the entire project into the container
COPY . ./

# Restore dependencies
RUN dotnet restore

# Build and publish the application
RUN dotnet publish -c Release -o out

# Display the contents of the 'out' directory for debugging
RUN ls -la out

# Use the .NET 8.0 runtime image for running the application
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Copy the published output from the build step
COPY --from=build-env /app/out .

# Expose port 80 inside the container
EXPOSE 80

# Set the entry point for the container
ENTRYPOINT ["dotnet", "AnthraBackend.dll"]
