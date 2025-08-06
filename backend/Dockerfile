FROM node:18-alpine

WORKDIR /app

# Install Python and build tools for native dependencies
RUN apk add --no-cache python3 make g++ py3-pip

# Copy package files
COPY package*.json ./

# Install ALL dependencies first (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application (requires TypeScript from devDependencies)
RUN npm run build

# Remove devDependencies after build to reduce image size
RUN npm prune --production

EXPOSE 3001

CMD ["npm", "start"]