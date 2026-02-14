#!/bin/sh
# Docker entrypoint script for Healthcare Platform Frontend

set -e

# Default backend URL if not provided
BACKEND_URL=${BACKEND_URL:-"https://healthcare-platform-backend.onrender.com"}

echo "🚀 Starting Healthcare Platform Frontend..."
echo "📡 Backend URL: $BACKEND_URL"

# Replace backend URL in nginx configuration
envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf > /tmp/nginx.conf
mv /tmp/nginx.conf /etc/nginx/nginx.conf

# Validate nginx configuration
nginx -t

echo "✅ Nginx configuration validated"
echo "🌐 Starting web server on port 80..."

# Execute the main command
exec "$@"