#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${SSH_ORIGINAL_COMMAND:-}" != "cd /var/www/aglegal && ./deploy.sh" ]]; then
  echo "Comando no autorizado." >&2
  exit 126
fi

exec /var/www/aglegal/deploy.sh
