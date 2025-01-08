FROM node:18 AS build
WORKDIR /app

# Copy package definition files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install

# Copy all other source files
COPY . .

# Build your application
RUN yarn build

# Now serve the build output with Nginx
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
