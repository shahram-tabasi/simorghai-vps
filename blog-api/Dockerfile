# =============================================================================
# Blog API - bilingual SEO blog with admin panel (Node + SQLite).
# Debian-slim base so better-sqlite3 and sharp install reliable prebuilt
# binaries. Build toolchain lives in a separate stage to keep the final
# image lean.
# =============================================================================
FROM node:20-bookworm-slim AS deps
WORKDIR /app
# Build tools in case a native module needs to compile from source.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

# --- Runtime image ---
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production \
    DATA_DIR=/data \
    PORT=4000
WORKDIR /app
# wget is used by the container healthcheck.
RUN apt-get update && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY public ./public

# Persistent data (SQLite DB + uploaded images) lives on a mounted volume.
RUN mkdir -p /data/uploads
VOLUME ["/data"]

EXPOSE 4000
CMD ["node", "src/server.js"]
