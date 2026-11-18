#!/usr/bin/env bash
# Smoke test of the production build (CI job `verify`; runs locally too):
#   VITE_DATA_SOURCE=http pnpm build && bash scripts/ci/smoke.sh
# Starts `node apps/server/dist/main.js` with NODE_ENV=production on an in-memory PGlite (empty database:
# migrations run on boot), waits for /api/health and checks that the SSR pages answer 200 with an <h1>.
# Env overrides: PORT (default 8799, so it never clashes with `pnpm dev` on 8787), SERVER_ENTRY, SMOKE_TIMEOUT (s),
# BASE_URL (skip starting a server and test one that is already running, e.g. a Docker container).
set -euo pipefail

cd "$(dirname "$0")/../.."

PORT="${PORT:-8799}"
SMOKE_TIMEOUT="${SMOKE_TIMEOUT:-60}"
SERVER_ENTRY="${SERVER_ENTRY:-apps/server/dist/main.js}"
LOG="$(mktemp -t was-smoke.XXXXXX)"
BODY="$(mktemp -t was-smoke-body.XXXXXX)"
PID=""

cleanup() {
  if [[ -n "$PID" ]] && kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
    wait "$PID" 2>/dev/null || true
  fi
  rm -f "$BODY"
}
trap cleanup EXIT

fail() {
  echo "smoke: FAIL: $*" >&2
  if [[ -s "$LOG" ]]; then
    echo "---- server log (tail) ----" >&2
    tail -n 60 "$LOG" >&2
  fi
  exit 1
}

if [[ -z "${BASE_URL:-}" ]]; then
  [[ -f "$SERVER_ENTRY" ]] || fail "$SERVER_ENTRY not found (run: VITE_DATA_SOURCE=http pnpm build)"
  BASE_URL="http://127.0.0.1:${PORT}"
  # Dummy production secrets: CI only, never used anywhere else. No Google credentials = sign-in disabled.
  NODE_ENV=production \
    HOST=127.0.0.1 \
    PORT="$PORT" \
    PGLITE_DATA_DIR=memory:// \
    IP_HASH_SALT="${IP_HASH_SALT:-ci-smoke-salt-not-a-secret}" \
    BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-ci-smoke-better-auth-secret-not-a-secret-000}" \
    PUBLIC_URL="$BASE_URL" \
    AUTH_SIMULATED=0 \
    LOG_REQUESTS=0 \
    node "$SERVER_ENTRY" >"$LOG" 2>&1 &
  PID=$!
  echo "smoke: started $SERVER_ENTRY (pid $PID) on $BASE_URL, log: $LOG"
fi

deadline=$((SECONDS + SMOKE_TIMEOUT))
until curl -fsS "$BASE_URL/api/health" >/dev/null 2>&1; do
  if [[ -n "$PID" ]] && ! kill -0 "$PID" 2>/dev/null; then fail "server exited before /api/health answered"; fi
  ((SECONDS < deadline)) || fail "/api/health did not answer within ${SMOKE_TIMEOUT}s"
  sleep 1
done
echo "smoke: ok /api/health"

# path, expected substring
check() {
  local path="$1" expect="$2"
  curl -fsS -o "$BODY" "$BASE_URL$path" || fail "GET $path did not answer 200"
  grep -q -- "$expect" "$BODY" || fail "GET $path: body has no '$expect'"
  echo "smoke: ok $path"
}

check / '<h1'
check /athletes '<h1'
check /robots.txt 'User-agent'

echo "smoke: all checks passed"
