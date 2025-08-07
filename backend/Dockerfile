FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies needed for native modules and Prisma
RUN apk add --no-cache python3 make g++ openssl1.1-compat

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npx tsc

# Verify build output
RUN test -f dist/server.js || (echo "Build failed - server.js not found" && exit 1)

# Expose port
EXPOSE 3001

# Start the application directly
CMD ["node", "dist/server.js"]