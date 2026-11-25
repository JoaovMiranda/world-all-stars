#!/bin/sh
# Entrypoint of the local Docker dev container (docker-compose.yml, service `app`).
set -e

npm i -g pnpm@11.13.0
pnpm install --frozen-lockfile --store-dir /pnpm/store

# First run (or after `pnpm docker:reset`): migrate + seed the container's own database and publish the rankings.
if [ ! -d "$PGLITE_DATA_DIR" ]; then
  pnpm db:reset
  pnpm rankings:calculate
fi

exec pnpm dev:api
