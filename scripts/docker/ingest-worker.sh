#!/bin/bash
# Entrypoint of the bulk collection worker (docker-compose.yml, service `ingest-worker`, profile `worker`).
# Writes to the compose Postgres (DATABASE_URL), never to the app's PGlite; Ollama runs natively on the Mac (Metal GPU).
# Resumable: on restart (reboot, crash) `collect` skips athletes that already have a biography of the current revision.
set -euo pipefail

npm i -g pnpm@11.13.0 >/dev/null
pnpm install --frozen-lockfile --store-dir /pnpm/store

mkdir -p /state data/review
LOG=data/review/collect.log
# First start on a fresh Postgres volume: migrations + seed (sources policy, sports, prototype base data).
if [ ! -f /state/pg-seeded ]; then
  pnpm db:seed
  touch /state/pg-seeded
fi

# Same arguments already completed: stay idle instead of re-running a finished job after every restart.
DONE="/state/done-$(printf '%s' "$COLLECT_ARGS" | sha1sum | cut -c1-12)"
if [ -f "$DONE" ]; then
  echo "[worker] collect $COLLECT_ARGS already finished at $(cat "$DONE"); idle (remove $DONE or change COLLECT_ARGS to run again)"
  exec sleep infinity
fi

echo "[worker] $(date -u +%FT%TZ) start: pnpm ingest collect $COLLECT_ARGS (model $OLLAMA_MODEL)" | tee -a "$LOG"
# shellcheck disable=SC2086 # COLLECT_ARGS is a list of CLI flags.
pnpm ingest collect $COLLECT_ARGS 2>&1 | tee -a "$LOG"
date -u +%FT%TZ > "$DONE"
echo "[worker] $(date -u +%FT%TZ) finished: pnpm ingest collect $COLLECT_ARGS" | tee -a "$LOG"
exec sleep infinity
