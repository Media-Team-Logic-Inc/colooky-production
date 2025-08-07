FROM node:18-alpine3.17

# Set working directory
WORKDIR /app

# Install system dependencies needed for native modules and Prisma
RUN apk add --no-cache python3 make g++ openssl openssl-dev ca-certificates

# Let Prisma auto-detect the correct binary for Alpine Linux

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy Prisma schema first
COPY prisma ./prisma

# Generate Prisma client (without database connection)
# Set a dummy DATABASE_URL for generation only
ENV DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy"
RUN npx prisma generate

# Remove the dummy DATABASE_URL (runtime will use the real one)
ENV DATABASE_URL=""

# Copy rest of source code
COPY . .

# Build TypeScript to JavaScript
RUN npx tsc

# Verify build output
RUN test -f dist/server.js || (echo "Build failed - server.js not found" && exit 1)

# Expose port
EXPOSE 3001

# Start the application directly
CMD ["node", "dist/server.js"]