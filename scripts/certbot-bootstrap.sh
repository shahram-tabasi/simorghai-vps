#!/bin/sh
# =============================================================================
# certbot-bootstrap.sh
# =============================================================================
# One-shot. Runs before nginx-proxy. Drops a 1-day self-signed cert at
# /etc/letsencrypt/live/${DOMAIN}/ if no cert exists yet, so nginx's HTTPS
# server block has files to reference at boot. Does nothing if a cert is
# already present (real or dummy from a previous run).
# =============================================================================
set -eu

: "${DOMAIN:?DOMAIN env var is required}"

LIVE_DIR="/etc/letsencrypt/live/${DOMAIN}"

if [ -f "${LIVE_DIR}/fullchain.pem" ] && [ -f "${LIVE_DIR}/privkey.pem" ]; then
    echo "[bootstrap] Existing cert at ${LIVE_DIR}; nothing to do."
    exit 0
fi

echo "[bootstrap] No cert at ${LIVE_DIR}; creating temporary 1-day self-signed cert."
mkdir -p "${LIVE_DIR}"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "${LIVE_DIR}/privkey.pem" \
    -out "${LIVE_DIR}/fullchain.pem" \
    -subj "/CN=${DOMAIN}" 2>/dev/null
echo "[bootstrap] done."
