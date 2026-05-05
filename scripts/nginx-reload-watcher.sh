#!/bin/sh
# =============================================================================
# nginx-reload-watcher.sh
# =============================================================================
# Runs in the background inside the nginx-proxy container. Polls the LE
# fullchain.pem mtime every 60s; when it changes (issuance or renewal by the
# certbot service), reloads nginx so the new cert is picked up without a
# restart.
# =============================================================================
set -eu

: "${DOMAIN:?DOMAIN env var is required}"

CERT_FILE="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"

log() { echo "[nginx-reload-watcher] $*"; }

# Wait for the cert file to appear (certbot bootstraps it before nginx starts,
# but be defensive in case ordering ever drifts).
while [ ! -f "${CERT_FILE}" ]; do
    sleep 2
done

last_mtime=$(stat -c %Y "${CERT_FILE}" 2>/dev/null || echo 0)
log "watching ${CERT_FILE} (initial mtime=${last_mtime})"

while :; do
    sleep 60
    if [ -f "${CERT_FILE}" ]; then
        cur_mtime=$(stat -c %Y "${CERT_FILE}" 2>/dev/null || echo 0)
        if [ "${cur_mtime}" != "${last_mtime}" ]; then
            log "cert changed (mtime ${last_mtime} -> ${cur_mtime}); reloading nginx"
            if nginx -s reload; then
                last_mtime="${cur_mtime}"
            else
                log "nginx reload failed; will retry on next change"
            fi
        fi
    fi
done
