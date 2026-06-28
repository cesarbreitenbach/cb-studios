# syntax=docker/dockerfile:1
# Build context MUST be the repo ROOT (.), so packages/shared is available.
# Multi-stage: deps -> build -> runtime.
# The web server runs TypeScript directly via tsx (start = NODE_ENV=production tsx server.ts).

# ---------------------------------------------------------------------------
# Stage 1: deps — install the full workspace dependency tree (cached).
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

# Drop the (macOS-generated) lockfile and install fresh so platform-specific
# optional deps — rollup & esbuild native binaries for THIS image's os/arch —
# resolve correctly. A cross-platform lockfile omits the linux-musl binaries
# and both `npm ci` and `npm install` then skip them, breaking the vite build
# (npm/cli#4828; the error itself recommends removing the lockfile).
RUN rm -f package-lock.json && npm install --no-audit --no-fund

# ---------------------------------------------------------------------------
# Stage 2: build — produce apps/web/dist/client (+ dist/server) via vite.
# Needs packages/shared TS source + apps/web source.
# ---------------------------------------------------------------------------
FROM deps AS build
WORKDIR /app

# Root tsconfig that apps/web/tsconfig.json extends (vite/esbuild reads it).
COPY tsconfig.base.json tsconfig.base.json
COPY packages/shared packages/shared
COPY apps/web apps/web

RUN npm -w apps/web run build

# ---------------------------------------------------------------------------
# Stage 3: runtime — keep node_modules + apps/web (incl. dist/client) +
# packages/shared, and run the production server (serves dist/client statically).
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Installed dependency tree (tsx + vite ssr runtime deps live here).
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json

# Root tsconfig (tsx reads it at runtime via apps/web/tsconfig.json extends).
COPY --from=build /app/tsconfig.base.json ./tsconfig.base.json

# Shared TS source — @cb/shared is resolved as source at runtime.
COPY --from=build /app/packages/shared ./packages/shared

# Web workspace including the built dist/ (client + server bundles).
COPY --from=build /app/apps/web ./apps/web

EXPOSE 3000

# start = "NODE_ENV=production tsx server.ts" — serves dist/client in prod.
CMD ["npm", "-w", "apps/web", "run", "start"]
