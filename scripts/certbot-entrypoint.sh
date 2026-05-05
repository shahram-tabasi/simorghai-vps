#!/bin/sh
# =============================================================================
# certbot-entrypoint.sh
# =============================================================================
# Runs inside the certbot container. Responsible for:
#   1. Bootstrapping a 1-day self-signed cert at the live/${DOMAIN} path so
#      nginx can boot its HTTPS server block on a fresh deployment.
#   2. Waiting for nginx to be reachable, then requesting a real Let's Encrypt
#      certificate (replaces the dummy). Tracked via a marker file so we only
#      do this once per domain.
#   3. Looping forever, running `certbot renew` every 12h. Renewals are picked
#      up by nginx-proxy via its file-watcher (sibling script).
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
NGINX_HEALTH_URL="http://nginx-proxy/health"

log() { echo "[certbot-entrypoint] $*"; }

create_dummy_cert() {
    log "Creating temporary 1-day self-signed cert at ${LIVE_DIR}"
    mkdir -p "${LIVE_DIR}"
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout "${LIVE_DIR}/privkey.pem" \
        -out "${LIVE_DIR}/fullchain.pem" \
        -subj "/CN=${DOMAIN}" 2>/dev/null
}

# -----------------------------------------------------------------------------
# 1. Bootstrap: ensure something exists at LIVE_DIR so nginx can start.
# -----------------------------------------------------------------------------
if [ ! -f "${LIVE_DIR}/fullchain.pem" ] || [ ! -f "${LIVE_DIR}/privkey.pem" ]; then
    create_dummy_cert
fi

# Signal readiness to the healthcheck (nginx-proxy depends on this).
mkdir -p "${WEBROOT}"
touch "${WEBROOT}/.certbot-ready"

# -----------------------------------------------------------------------------
# 2. Initial issuance: only if we haven't successfully obtained a real cert yet.
# -----------------------------------------------------------------------------
if [ ! -f "${ACQUIRED_MARKER}" ]; then
    log "No acquisition marker found; will request a real cert for ${DOMAIN}."

    # Wait for nginx to be reachable so it can serve the ACME HTTP-01 challenge.
    log "Waiting for nginx-proxy at ${NGINX_HEALTH_URL}..."
    i=0
    while ! wget -qO- --timeout=2 "${NGINX_HEALTH_URL}" > /dev/null 2>&1; do
        i=$((i + 1))
        if [ "${i}" -ge 120 ]; then
            log "WARNING: nginx-proxy not reachable after 120s; trying anyway."
            break
        fi
        sleep 1
    done

    # Wipe any stale dummy state so certbot creates a clean live/archive layout.
    rm -rf "${LIVE_DIR}" "${ARCHIVE_DIR}"
    rm -f  "${RENEWAL_CONF}"

    log "Requesting Let's Encrypt cert for ${DOMAIN} (email: ${CERTBOT_EMAIL})..."
    if certbot certonly \
        --webroot -w "${WEBROOT}" \
        -d "${DOMAIN}" \
        --email "${CERTBOT_EMAIL}" \
        --agree-tos --no-eff-email \
        --non-interactive --keep-until-expiring; then
        log "Certificate obtained successfully."
        touch "${ACQUIRED_MARKER}"
    else
        log "ERROR: certbot failed. Restoring dummy cert so nginx keeps serving."
        log "Common causes: DNS not pointing here, port 80 blocked, Cloudflare proxy intercepting challenge, or LE rate limit."
        create_dummy_cert
        log "Will retry on the next renewal cycle."
    fi
fi

# -----------------------------------------------------------------------------
# 3. Renewal loop. certbot renew is a no-op until certs are within 30 days of
#    expiry, so running every 12h is safe and idempotent.
# -----------------------------------------------------------------------------
log "Entering renewal loop (every 12h)."
trap 'log "Received TERM, exiting."; exit 0' TERM INT
while :; do
    sleep 12h &
    wait $!

    # If we still don't have a real cert, retry issuance instead of renewal.
    if [ ! -f "${ACQUIRED_MARKER}" ]; then
        log "Still no real cert; retrying issuance."
        rm -rf "${LIVE_DIR}" "${ARCHIVE_DIR}"
        rm -f  "${RENEWAL_CONF}"
        if certbot certonly \
            --webroot -w "${WEBROOT}" \
            -d "${DOMAIN}" \
            --email "${CERTBOT_EMAIL}" \
            --agree-tos --no-eff-email \
            --non-interactive --keep-until-expiring; then
            log "Certificate obtained on retry."
            touch "${ACQUIRED_MARKER}"
        else
            log "Issuance retry failed; will try again in 12h."
            create_dummy_cert
        fi
    else
        log "Running certbot renew..."
        certbot renew --webroot -w "${WEBROOT}" --quiet || \
            log "Renewal attempt failed; will retry in 12h."
    fi
done
