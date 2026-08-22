# ============================================================
# STAGE 1: Build Frontend Assets
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies (including devDependencies for Vite)
RUN npm ci

# Copy source code
COPY . .

# Build production bundle (Vite dist)
RUN npm run build

# ============================================================
# STAGE 2: Production Server & Runner
# ============================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled frontend from builder
COPY --from=builder /app/dist ./dist

# Copy backend server directory
COPY --from=builder /app/server ./server

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Run API server (which also serves the Vite SPA frontend)
CMD ["node", "server/index.js"]
