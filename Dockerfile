# Multi-stage Dockerfile for Next.js 15 App Router
# 1) deps: install dependencies
# 2) builder: build Next.js
# 3) runner: run production server

# ----- deps -----
FROM node:20-alpine AS deps
WORKDIR /app

# Install OS deps (optional, useful for node-gyp if needed)
RUN apk add --no-cache libc6-compat

COPY package*.json ./
# Prefer npm ci for reproducible builds
RUN npm ci

# ----- builder -----
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set env for production build
ENV NODE_ENV=production

# Build Next.js
RUN npm run build

# ----- runner -----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy only the necessary files from builder
# Copy .next, public, and package files plus node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

USER nextjs

# Start Next.js
CMD ["npm", "run", "start:prod"]
