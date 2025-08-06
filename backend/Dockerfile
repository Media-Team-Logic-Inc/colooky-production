FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++ py3-pip

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Install dev dependencies temporarily for build
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Verify the built application exists
RUN ls -la dist/ && test -f dist/server.js

EXPOSE 3001

# Use exec form to avoid shell interpretation issues
CMD ["node", "dist/server.js"]