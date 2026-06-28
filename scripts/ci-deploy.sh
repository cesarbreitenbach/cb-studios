#!/usr/bin/env bash
# Server-side deploy for cb-studios. Invoked over SSH by .github/workflows/deploy.yml
# as:  cd ~/cb-studios && ./scripts/ci-deploy.sh <git-sha>
# Mirrors the cb-faucet (Luckyblock) deploy flow.
set -euo pipefail

SHA="${1:-origin/main}"
COMPOSE="docker-compose.prod.yml"

cd "$(dirname "$0")/.."

echo "==> Fetching latest"
git fetch --all --prune
echo "==> Checking out $SHA"
git reset --hard "$SHA"

# The external network the shared Probody Caddy joins to reach cb_studios_web.
# Idempotent: create it once if it does not exist yet.
docker network inspect cb-studios-net >/dev/null 2>&1 || docker network create cb-studios-net

echo "==> Building and starting containers"
docker compose -f "$COMPOSE" up -d --build

echo "==> Running database migrations"
docker compose -f "$COMPOSE" exec -T cb-api npm -w apps/api run db:migrate

echo "==> Pruning dangling images"
docker image prune -f >/dev/null 2>&1 || true

echo "==> Deploy complete"
