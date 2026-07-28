# Use Node.js 18 alpine image
FROM node:18-alpine

# Force rebuild timestamp: 2025-01-05 12:00:00

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Make diagnostic script executable
RUN chmod +x diagnostic.sh

# Expose port (fly.io will set PORT env var to 8080)
EXPOSE 8080

# Start the production server
CMD ["node", "server.cjs"]