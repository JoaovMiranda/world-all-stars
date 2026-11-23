#!/usr/bin/env bash
# Throwaway Postgres cluster for the concurrency suites (T1.9) using the local Homebrew binaries (no Docker).
#   scripts/test/start-test-postgres.sh            → prints DATABASE_URL (last line of stdout)
#   eval "$(scripts/test/start-test-postgres.sh --export)"   → exports DATABASE_URL in the current shell
# Env: PG_TEST_DIR (cluster dir, default $TMPDIR/was-pg-test), PG_TEST_PORT (default 54329), PG_BIN (bin dir).
# Stop and delete it with scripts/test/stop-test-postgres.sh.
set -euo pipefail
# macOS: postmaster refuses to start ("became multithreaded during startup") without a valid locale.
export LC_ALL="${LC_ALL:-C}" LANG="${LANG:-C}"

DIR="${PG_TEST_DIR:-${TMPDIR:-/tmp}/was-pg-test}"
DIR="${DIR%/}"
PORT="${PG_TEST_PORT:-54329}"
USER_NAME="${PG_TEST_USER:-postgres}"
if [[ -z "${PG_BIN:-}" ]]; then
  for candidate in /opt/homebrew/opt/postgresql@18/bin /opt/homebrew/opt/postgresql@17/bin /opt/homebrew/opt/postgresql@15/bin /usr/local/opt/postgresql@18/bin /usr/lib/postgresql/18/bin; do
    if [[ -x "$candidate/pg_ctl" ]]; then PG_BIN="$candidate"; break; fi
  done
fi
if [[ -z "${PG_BIN:-}" ]]; then
  PG_BIN="$(dirname "$(command -v pg_ctl 2>/dev/null || echo /nonexistent/pg_ctl)")"
fi
[[ -x "$PG_BIN/pg_ctl" ]] || { echo "pg_ctl not found (set PG_BIN)" >&2; exit 1; }

DATA="$DIR/data"
if [[ ! -f "$DATA/PG_VERSION" ]]; then
  mkdir -p "$DIR"
  "$PG_BIN/initdb" -D "$DATA" -U "$USER_NAME" --auth=trust --encoding=UTF8 --no-locale >"$DIR/initdb.log" 2>&1 \
    || { cat "$DIR/initdb.log" >&2; exit 1; }
fi

if "$PG_BIN/pg_ctl" -D "$DATA" status >/dev/null 2>&1; then
  echo "test Postgres already running in $DATA" >&2
else
  if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "port $PORT is busy (set PG_TEST_PORT)" >&2
    exit 1
  fi
  # TCP only (no Unix socket: long temp paths exceed the socket path limit); fsync off: throwaway data, faster tests.
  "$PG_BIN/pg_ctl" -D "$DATA" -l "$DIR/postgres.log" -w -t 30 \
    -o "-p $PORT -c unix_socket_directories= -c listen_addresses=127.0.0.1 -c fsync=off -c synchronous_commit=off -c full_page_writes=off -c max_connections=200" \
    start >&2
fi

URL="postgres://$USER_NAME@127.0.0.1:$PORT/postgres"
if [[ "${1:-}" == "--export" ]]; then
  echo "export DATABASE_URL=$URL"
else
  echo "$URL"
fi
