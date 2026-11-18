# syntax=docker/dockerfile:1
# World All Stars: one process serves /api and the server-rendered pages (doc 06/12). No host chosen yet: this image
# is only built in CI (`docker` job) to prove it builds. Usage (README, "CI e Docker"):
#   docker build -t world-all-stars .
#   docker run --rm -p 8787:8787 --env-file .env.production -v was-data:/data world-all-stars
#
# Layout of the runtime image (/app):
#   main.js (+ .map)  server bundle (esbuild; @was/* inlined, npm deps external)
#   migrations/       SQL migrations (also the bundle's default: ./migrations next to main.js)
#   web/client        browser assets + .vite/manifest.json (served by the server, /assets/* immutable)
#   web/server        SSR bundle (entry-server.js, self-contained)
#   node_modules/     production deps of apps/server (pnpm deploy)
#   /data             volume: embedded PGlite (PGLITE_DATA_DIR=/data/pglite), unless DATABASE_URL points to Postgres

# node:26-slim (Node 26.13.1, Debian trixie), multi-arch index digest resolved on 2026-11-17.
# Update: re-resolve the digest of the tag and replace it here (used by the base and runtime stages).
ARG NODE_IMAGE=node:26-slim@sha256:e6bedef217677b276c591795e169840edd9096dbf13f29df8ef8d1856b8820bc

# ── base: Node + pnpm (Node 26 ships no corepack) ──
FROM ${NODE_IMAGE} AS base
ENV CI=true \
    PNPM_STORE=/pnpm/store \
    TURBO_TELEMETRY_DISABLED=1
# Same version as "packageManager" in package.json.
RUN npm install -g pnpm@11.13.0 && npm cache clean --force
WORKDIR /repo

# ── deps: only the lockfile and the manifests, so this layer is cached until a dependency changes ──
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml .pnpmfile.cjs .npmrc package.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
RUN pnpm fetch --store-dir "$PNPM_STORE"
RUN pnpm install --frozen-lockfile --offline --store-dir "$PNPM_STORE"

# ── build: web (client + SSR) and server bundles, then the pruned production node_modules of the server ──
FROM deps AS build
COPY . .
# The site talks to the real API (fixtures are dev only).
ENV VITE_DATA_SOURCE=http
RUN pnpm build
# pnpm 10+ deploys only injected workspace packages by default; --legacy keeps the plain symlinked layout.
# The @was/* packages are already inlined in main.js, so only the npm deps of apps/server matter here.
RUN pnpm --filter server deploy --prod --legacy --offline --store-dir "$PNPM_STORE" /out

# ── runtime ──
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787 \
    WEB_DIST_DIR=/app/web \
    MIGRATIONS_DIR=/app/migrations \
    PGLITE_DATA_DIR=/data/pglite
WORKDIR /app
# Code stays owned by root (read-only for the app user); only /data is writable.
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /repo/apps/server/dist/main.js /repo/apps/server/dist/main.js.map /repo/apps/server/dist/instrumentation.js ./
COPY --from=build /repo/apps/server/dist/migrations ./migrations
COPY --from=build /repo/apps/web/dist/client ./web/client
COPY --from=build /repo/apps/web/dist/server ./web/server
RUN mkdir -p /data/pglite && chown -R node:node /data
VOLUME /data
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 8787) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
# instrumentation.js: OpenTelemetry, a no-op unless OTEL_EXPORTER_OTLP_ENDPOINT is set.
CMD ["node", "--enable-source-maps", "--import", "./instrumentation.js", "main.js"]
