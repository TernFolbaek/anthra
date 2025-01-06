# Stage 1: Build the frontend with Node
FROM node:18 AS build
WORKDIR /app

# Copy package definition files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install

# Copy all other source files
COPY . .

# Build your application
RUN yarn build

# Stage 2: Serve the build output with Nginx
FROM nginx:stable-alpine

# Copy the custom Nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy the build files from the first stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
