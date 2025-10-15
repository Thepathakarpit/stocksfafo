# Railway-optimized Dockerfile for Stock Trading Platform
# Single-service deployment: Backend serves both API and Frontend

FROM node:18-alpine AS base

# ======================
# Stage 1: Build Frontend
# ======================
FROM base AS frontend-build
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Copy frontend source
COPY frontend ./

# Build React app
RUN npm run build

# ======================
# Stage 2: Build Backend
# ======================
FROM base AS backend-build
WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
COPY backend/tsconfig.json ./

# Install ALL dependencies (including devDependencies for TypeScript compilation)
RUN npm ci --prefer-offline --no-audit

# Copy backend source
COPY backend/src ./src

# Compile TypeScript
RUN npm run build

# ======================
# Stage 3: Production Runtime
# ======================
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy backend package files
COPY backend/package*.json ./backend/

# Install ONLY production dependencies
WORKDIR /app/backend
RUN npm ci --only=production --prefer-offline --no-audit

# Copy compiled backend
WORKDIR /app
COPY --from=backend-build /app/backend/dist ./backend/dist

# Copy built frontend
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Create data directory for user persistence
RUN mkdir -p ./backend/dist/data && chown -R node:node ./backend/dist/data

# Use non-root user
USER node

# Expose port (Railway will set PORT env variable)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+process.env.PORT+'/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "backend/dist/server.js"]
