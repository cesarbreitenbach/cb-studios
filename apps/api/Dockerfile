# syntax=docker/dockerfile:1
# Build context MUST be the repo ROOT (.), so packages/shared is available.
# The api runs TypeScript directly via tsx — no JS transpile step.

FROM node:20-alpine

WORKDIR /app

# --- Dependency layer (cached on lockfile + manifests only) ---
# Copy root manifest + lockfile and every workspace package.json first so
# `npm ci` can be cached independently of source changes.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install the full workspace dependency tree (tsx + drizzle live here).
# Drop the (macOS-generated) lockfile and install fresh so the esbuild native
# binary for THIS image's os/arch resolves — tsx runs esbuild at runtime, and a
# cross-platform lockfile omits the linux binary (npm/cli#4828).
RUN rm -f package-lock.json && npm install --no-audit --no-fund

# --- Source layer ---
# Root tsconfig that apps/api/tsconfig.json extends (tsx reads it at runtime).
COPY tsconfig.base.json tsconfig.base.json
# api source + shared TS source (@cb/shared is consumed as TS source).
COPY packages/shared packages/shared
COPY apps/api apps/api

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# On boot: run pending Drizzle migrations, then start the server.
# Both scripts run via tsx (TS at runtime), resolving @cb/shared source.
CMD ["sh", "-c", "npm -w apps/api run db:migrate && npm -w apps/api run start"]
