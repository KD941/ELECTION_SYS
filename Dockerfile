# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy deps and source
COPY --from=builder /app/node_modules ./node_modules
COPY server.js ./
COPY public ./public

# Cloud Run sets PORT=8080 by default
ENV PORT=8080
EXPOSE 8080

USER appuser
CMD ["node", "server.js"]
