# Bake inotify-tools into the nginx image so the cert-reload watcher inside
# the container can react to certbot writes without a docker.sock sidecar
# and without runtime `apk add` (the production VPS has restricted internet
# egress; runtime package installs would fail there).
FROM nginx:alpine
RUN apk add --no-cache inotify-tools
