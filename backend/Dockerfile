# Simplified optimized Dockerfile for Abunfi Backend (No build step needed)
FROM node:18-alpine

# Install security updates, dumb-init for signal handling, and curl for health checks
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init curl && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf ~/.npm

# Copy source code
COPY src/ ./src/

# Create logs directory with proper permissions
RUN mkdir -p logs && \
    chown -R nodejs:nodejs /app && \
    chmod 755 /app && \
    chmod 755 /app/logs

# Switch to non-root user for security
USER nodejs

# Expose port
EXPOSE 3001

# Enhanced health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Set environment variables for production
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application directly
CMD ["node", "src/index.js"]
