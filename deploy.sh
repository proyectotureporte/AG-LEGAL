#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_DIR="/var/www/aglegal"
readonly HEALTH_URL="http://127.0.0.1:4009/api/health"

cd "$APP_DIR"

git fetch --prune origin main
git checkout main
git pull --ff-only origin main

corepack enable
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm typecheck
pnpm build

pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

for attempt in {1..20}; do
  if curl --fail --silent --show-error "$HEALTH_URL" >/dev/null; then
    echo "AG Legal desplegado y saludable."
    exit 0
  fi
  sleep 2
done

echo "El proceso no superó el healthcheck." >&2
pm2 logs aglegal --lines 80 --nostream >&2 || true
exit 1
