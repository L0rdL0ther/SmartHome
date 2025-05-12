# Base image
FROM nginx:alpine

# Install envsubst
RUN apk add --no-cache gettext

# Clear default content directory
RUN rm -rf /usr/share/nginx/html/*

# Copy built files to nginx content directory
COPY ./dist /usr/share/nginx/html

# Copy env config template
COPY ./env-config.js /usr/share/nginx/html/env-config.js.template

# Copy entrypoint script
COPY ./docker-entrypoint.sh /docker-entrypoint.sh

# Make the entrypoint script executable
RUN chmod +x /docker-entrypoint.sh

# Set default environment variable
ENV API_URL=http://NAHNAHHHHHH

# Expose port 80
EXPOSE 80

# Set entrypoint to our script
ENTRYPOINT ["/docker-entrypoint.sh"]
