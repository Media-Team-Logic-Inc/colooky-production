FROM node:18-alpine

WORKDIR /app

# Install Python and build tools for native dependencies
RUN apk add --no-cache python3 make g++ py3-pip

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]