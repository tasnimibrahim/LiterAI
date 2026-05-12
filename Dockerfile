# Multi-stage build for LiterAI — Hugging Face Spaces (Docker SDK)
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (need devDeps for build)
RUN npm ci

# Copy source code
COPY . .

# Build the Vite frontend and compile TypeScript server
RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:24-alpine AS production

WORKDIR /app

# Copy built frontend and server
COPY --from=builder /app/dist ./dist

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy database schema for drizzle if needed at runtime
COPY drizzle ./drizzle

# Create writable db directory
RUN mkdir -p /app/db && chown -R 1000:1000 /app/db /app

# HF Spaces runs containers as UID 1000
USER 1000

# HF Spaces default port
EXPOSE 7860

ENV NODE_ENV=production
ENV PORT=7860

# Start the server using node
CMD ["node", "dist/server/_core/index.js"]
