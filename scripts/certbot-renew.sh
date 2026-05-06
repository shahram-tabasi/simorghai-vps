#!/bin/sh
# =============================================================================
# certbot-renew.sh
# =============================================================================
# Long-running. Loops every $RENEW_INTERVAL (default 12h):
#   - If we still have only a dummy cert (no acquired marker), retry the full
#     issuance flow. Lets the deployment self-heal once DNS / port 80 / etc.
#     are fixed without operator action.
#   - Otherwise, run `certbot renew` (idempotent, no-op until cert is within
#     30 days of expiry).
# Either way, certbot rewrites files in /etc/letsencrypt/live/${DOMAIN}/, and
# nginx-proxy's inotify-based watcher picks up the change and reloads nginx.
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
RENEW_INTERVAL="${RENEW_INTERVAL:-12h}"

restore_dummy() {
    mkdir -p "${LIVE_DIR}"
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout "${LIVE_DIR}/privkey.pem" \
        -out "${LIVE_DIR}/fullchain.pem" \
        -subj "/CN=${DOMAIN}" 2>/dev/null
}

trap 'echo "[renew] received TERM, exiting"; exit 0' TERM INT

echo "[renew] starting renewal loop (interval=${RENEW_INTERVAL})"
while :; do
    sleep "${RENEW_INTERVAL}" &
    wait $!

    if [ -f "${ACQUIRED_MARKER}" ]; then
        echo "[renew] running certbot renew..."
        certbot renew --webroot -w "${WEBROOT}" --quiet || \
            echo "[renew] renewal attempt failed; will retry in ${RENEW_INTERVAL}"
    else
        echo "[renew] no real cert yet; retrying initial issuance..."
        rm -rf "${LIVE_DIR}" "${ARCHIVE_DIR}"
        rm -f  "${RENEWAL_CONF}"
        if certbot certonly \
            --webroot -w "${WEBROOT}" \
            -d "${DOMAIN}" \
            --email "${CERTBOT_EMAIL}" \
            --agree-tos --no-eff-email \
            --non-interactive; then
            touch "${ACQUIRED_MARKER}"
            echo "[renew] certificate obtained for ${DOMAIN}."
        else
            echo "[renew] issuance retry failed; restoring dummy"
            restore_dummy
        fi
    fi
done
