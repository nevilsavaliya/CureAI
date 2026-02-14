# Healthcare Platform Backend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Create uploads directory
RUN mkdir -p uploads/hospital-documents

# Expose port
EXPOSE 3000

# Health check with configurable URL and fallback logic
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f "${HEALTH_CHECK_URL:-http://localhost:${PORT:-3000}/api/health}" || exit 1

# Start the application
CMD ["npm", "start"]