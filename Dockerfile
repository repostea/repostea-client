# Repostea Client - Development Dockerfile
# For local testing only, not recommended for production

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Build the application
RUN npm run build

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
