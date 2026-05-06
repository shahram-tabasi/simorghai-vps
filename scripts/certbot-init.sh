#!/bin/sh
# =============================================================================
# certbot-init.sh
# =============================================================================
# One-shot. Runs after nginx-proxy is healthy. Replaces the bootstrap
# self-signed cert with a real Let's Encrypt cert via the HTTP-01 webroot
# challenge. Idempotent: skipped on subsequent runs by checking a marker file.
# Always exits 0 so a transient failure doesn't break `docker compose up`;
# certbot-renew will keep retrying.
# =============================================================================
set -eu

: "${DOMAIN:?DOMAIN env var is required}"
: "${CERTBOT_EMAIL:?CERTBOT_EMAIL env var is required}"

LE_DIR="/etc/letsencrypt"
LIVE_DIR="${LE_DIR}/live/${DOMAIN}"
ARCHIVE_DIR="${LE_DIR}/archive/${DOMAIN}"
RENEWAL_CONF="${LE_DIR}/renewal/${DOMAIN}.conf"
ACQUIRED_MARKER="${LE_DIR}/.le-acquired-${DOMAIN}"
WEBROOT="/var/www/certbot"

restore_dummy() {
    mkdir -p "${LIVE_DIR}"
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout "${LIVE_DIR}/privkey.pem" \
        -out "${LIVE_DIR}/fullchain.pem" \
        -subj "/CN=${DOMAIN}" 2>/dev/null
}

if [ -f "${ACQUIRED_MARKER}" ]; then
    echo "[init] Real cert already acquired for ${DOMAIN}; nothing to do."
    exit 0
fi

# Wipe any dummy state so certbot can create a clean live/archive layout.
rm -rf "${LIVE_DIR}" "${ARCHIVE_DIR}"
rm -f  "${RENEWAL_CONF}"

echo "[init] Requesting Let's Encrypt cert for ${DOMAIN} (email: ${CERTBOT_EMAIL})..."
if certbot certonly \
    --webroot -w "${WEBROOT}" \
    -d "${DOMAIN}" \
    --email "${CERTBOT_EMAIL}" \
    --agree-tos --no-eff-email \
    --non-interactive; then
    touch "${ACQUIRED_MARKER}"
    echo "[init] Certificate obtained for ${DOMAIN}."
else
    echo "[init] WARNING: certbot failed. Restoring dummy cert so nginx keeps serving."
    echo "[init] Common causes: DNS not pointing here, port 80 blocked, Cloudflare proxy intercepting challenge, or LE rate limit."
    echo "[init] certbot-renew will retry every 12h."
    restore_dummy
fi

# Always succeed so the renew chain proceeds.
exit 0
