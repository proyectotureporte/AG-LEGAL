#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_DIR="/var/www/aglegal"
readonly APP_ENV="${APP_DIR}/.env"
readonly DOMAIN="aglegal.com.co"
readonly WWW_DOMAIN="www.aglegal.com.co"
readonly CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
readonly NGINX_CONFIG="/etc/nginx/sites-available/aglegal.restaurar.co"
readonly STATE_DIR="/var/lib/aglegal-domain"
readonly HEALTH_URL="http://127.0.0.1:3004/api/health"

log_notice() {
  logger -t aglegal-domain "$*"
}

dns_ready() {
  local hostname="$1"
  [[ -n "$(dig +short A "$hostname"; dig +short AAAA "$hostname")" ]]
}

certificate_has_www() {
  [[ -s "${CERT_DIR}/fullchain.pem" ]] &&
    openssl x509 -in "${CERT_DIR}/fullchain.pem" -noout -ext subjectAltName 2>/dev/null |
      grep -Fq "DNS:${WWW_DOMAIN}"
}

issue_certificate() {
  local -a domains=(--domains "$DOMAIN")

  if dns_ready "$WWW_DOMAIN"; then
    domains+=(--domains "$WWW_DOMAIN")
  fi

  if [[ -s "${CERT_DIR}/fullchain.pem" ]]; then
    domains+=(--expand)
  else
    domains+=(--keep-until-expiring)
  fi

  certbot certonly \
    --webroot \
    --webroot-path /var/www/letsencrypt \
    --cert-name "$DOMAIN" \
    "${domains[@]}" \
    --non-interactive \
    --agree-tos \
    --no-eff-email
}

rollback() {
  local backup_dir="$1"

  cp --preserve=all "${backup_dir}/nginx.conf" "$NGINX_CONFIG"
  cp --preserve=all "${backup_dir}/app.env" "$APP_ENV"
  nginx -t
  systemctl reload nginx
  pm2 reload aglegal --update-env
}

if ! dns_ready "$DOMAIN"; then
  exit 0
fi

if [[ ! -s "${CERT_DIR}/fullchain.pem" ]] ||
  { dns_ready "$WWW_DOMAIN" && ! certificate_has_www; }; then
  if ! issue_certificate; then
    log_notice "TLS pendiente: Certbot no pudo validar todavía $DOMAIN."
    exit 0
  fi
fi

selected_config="${APP_DIR}/ops/nginx.conf"
if certificate_has_www; then
  selected_config="${APP_DIR}/ops/nginx.with-www.conf"
fi

install -d -m 700 "$STATE_DIR"
backup_dir="$(mktemp -d /var/backups/aglegal-domain-activation.XXXXXX)"
cp --preserve=all "$NGINX_CONFIG" "${backup_dir}/nginx.conf"
cp --preserve=all "$APP_ENV" "${backup_dir}/app.env"

if ! grep -q "^APP_URL=" "$APP_ENV"; then
  log_notice "Activación cancelada: APP_URL no existe en ${APP_ENV}."
  exit 1
fi

if ! cmp -s "$selected_config" "$NGINX_CONFIG"; then
  install -o root -g root -m 644 "$selected_config" "$NGINX_CONFIG"
  if ! nginx -t; then
    cp --preserve=all "${backup_dir}/nginx.conf" "$NGINX_CONFIG"
    nginx -t
    log_notice "Activación cancelada: la configuración final de Nginx no es válida."
    exit 1
  fi
  systemctl reload nginx
fi

if ! grep -qx "APP_URL=https://${DOMAIN}" "$APP_ENV"; then
  sed -i "s#^APP_URL=.*#APP_URL=https://${DOMAIN}#" "$APP_ENV"
  chmod 600 "$APP_ENV"
  if ! pm2 reload aglegal --update-env; then
    rollback "$backup_dir"
    log_notice "Activación revertida: PM2 no pudo recargar AG Legal."
    exit 1
  fi
fi

for attempt in {1..20}; do
  if curl --fail --silent --show-error "$HEALTH_URL" >/dev/null &&
    curl --fail --silent --show-error \
      --resolve "${DOMAIN}:443:127.0.0.1" \
      "https://$DOMAIN/api/health" >/dev/null; then
    break
  fi

  if [[ "$attempt" -eq 20 ]]; then
    rollback "$backup_dir"
    log_notice "Activación revertida: AG Legal no superó el healthcheck."
    exit 1
  fi

  sleep 2
done

if [[ ! -e "${STATE_DIR}/apex-active" ]]; then
  touch "${STATE_DIR}/apex-active"
  printf "%s | AG Legal: dominio canónico %s activado con TLS, Nginx, APP_URL y PM2 verificados | OK\n" \
    "$(date -Is)" "$DOMAIN" >> /var/www/vps-admin.log
fi

if certificate_has_www; then
  touch "${STATE_DIR}/www-active"
  systemctl disable aglegal-domain-activate.timer >/dev/null 2>&1 || true
  systemctl stop aglegal-domain-activate.timer >/dev/null 2>&1 || true
fi
