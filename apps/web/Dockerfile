# =============================================================================
# SocialNova Web - Multi-stage Dockerfile
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Base
# ---------------------------------------------------------------------------
FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat curl

WORKDIR /app

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# ---------------------------------------------------------------------------
# Stage 2: Dependencies
# ---------------------------------------------------------------------------
FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci --only=production && \
    cp -R node_modules /tmp/prod_modules && \
    npm ci

# ---------------------------------------------------------------------------
# Stage 3: Development
# ---------------------------------------------------------------------------
FROM base AS development

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npm", "run", "dev"]

# ---------------------------------------------------------------------------
# Stage 4: Production Builder
# ---------------------------------------------------------------------------
FROM base AS production-builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set production env
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

RUN npm run build

# ---------------------------------------------------------------------------
# Stage 5: Production Runner
# ---------------------------------------------------------------------------
FROM node:20-alpine AS production

RUN apk add --no-cache libc6-compat curl

WORKDIR /app

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy production dependencies
COPY --from=deps /tmp/prod_modules ./node_modules

# Copy built application
COPY --from=production-builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=production-builder --chown=nextjs:nodejs /app/public ./public
COPY --from=production-builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=production-builder --chown=nextjs:nodejs /app/next.config.* ./

# Set production env
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

USER nextjs

EXPOSE 3000

ENV PORT=3000 \
    HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
