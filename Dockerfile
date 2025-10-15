# Multi-stage Dockerfile for Railway deployment
FROM node:18-alpine AS base

# Install dependencies for both frontend and backend
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install all dependencies (using workspaces)
RUN npm ci

# Build frontend
FROM base AS frontend-builder
WORKDIR /app

# Copy frontend files
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ ./frontend/
COPY package*.json ./

# Build the React app
WORKDIR /app/frontend
RUN npm run build

# Build backend
FROM base AS backend-builder
WORKDIR /app

# Copy backend files
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ ./backend/
COPY package*.json ./

# Build the backend
WORKDIR /app/backend
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy built frontend into backend
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Copy root package.json
COPY package*.json ./

# Expose port (Railway will set PORT env variable)
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
