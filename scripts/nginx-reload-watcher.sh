#!/bin/sh
# =============================================================================
# nginx-reload-watcher.sh
# =============================================================================
# Runs in the background inside the nginx-proxy container. Uses inotifywait
# on /etc/letsencrypt/live to react instantly when certbot writes a new cert.
# A short debounce window collapses the burst of writes from a single
# issuance/renewal into one `nginx -s reload`.
#
# Why in-container instead of a sidecar? Avoids mounting /var/run/docker.sock
# and the privilege-escalation surface that comes with it. The image has
# inotify-tools baked in (see nginx/Dockerfile).
# =============================================================================
set -eu

: "${DOMAIN:?DOMAIN env var is required}"

CERT_FILE="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
WATCH_DIR="/etc/letsencrypt/live"
DEBOUNCE_SECS=3

log() { echo "[reload-watcher] $*"; }

# Wait for the cert file to appear (bootstrap creates it before nginx starts,
# but be defensive against ordering drift).
while [ ! -f "${CERT_FILE}" ]; do sleep 1; done

log "watching ${WATCH_DIR} for cert changes"

# Monitor close_write / moved_to / delete; certbot writes via temp files and
# atomic rename, which surfaces as moved_to on the destination.
inotifywait -m -q -r \
    -e close_write -e moved_to -e delete \
    "${WATCH_DIR}" | \
while read -r _path _events _file; do
    # Drain any further events that arrive within the debounce window so a
    # multi-file renewal triggers exactly one reload.
    while read -r -t "${DEBOUNCE_SECS}" _ _ _; do :; done

    if [ -f "${CERT_FILE}" ]; then
        log "cert change settled; reloading nginx"
        nginx -s reload || log "nginx reload failed"
    else
        log "cert file missing after change; skipping reload"
    fi
done
