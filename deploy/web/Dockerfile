# =============================================================================
# SocialNova Web - Monorepo-aware production Dockerfile (Fly.io)
#
# Builds the Next.js app with `output: "standalone"` from the repo ROOT so the
# npm workspaces / hoisted node_modules resolve. The runner image only ships
# the standalone server (no full node_modules, no source).
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Dependencies
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json

# Use `npm install` (not `npm ci`): the committed lockfile was generated on
# Windows and only records the win32 lightningcss native binary, so `npm ci`
# on Linux/Alpine cannot resolve the platform-correct optional dependency.
RUN npm install --no-audit --no-fund

# ---------------------------------------------------------------------------
# Stage 2: Builder
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps apps

RUN npm install --no-audit --no-fund

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# Build only the web workspace. Standalone output lands in
# apps/web/.next/standalone with the monorepo path preserved.
RUN npm run build --workspace=@socialnova/web

# ---------------------------------------------------------------------------
# Stage 3: Runner
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /repo

RUN apk add --no-cache libc6-compat curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone server (contains apps/web/server.js + minimal node_modules).
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
# Static assets + public dir are NOT bundled into standalone output.
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

USER nextjs

EXPOSE 3000

# Health check must survive in the lean runner (adds busybox wget on alpine).
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -q -O /dev/null http://localhost:3000/api/health || exit 1

CMD ["node", "apps/web/server.js"]