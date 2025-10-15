# Simplified Dockerfile for Railway - No workspace complications
FROM node:18-alpine AS base

# Build frontend
FROM base AS frontend-builder
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Build backend
FROM base AS backend-builder
WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy backend source
COPY backend/ ./

# Build backend
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy backend package files
COPY backend/package*.json ./backend/

# Install ONLY production dependencies for backend
WORKDIR /app/backend
RUN npm ci --only=production

# Copy built backend
WORKDIR /app
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy built frontend
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Copy root package.json for start script
COPY package.json ./

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "backend/dist/server.js"]
