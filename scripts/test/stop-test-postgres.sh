#!/usr/bin/env bash
# Stops the throwaway cluster started by start-test-postgres.sh and deletes its directory (pass --keep to keep it).
set -euo pipefail

DIR="${PG_TEST_DIR:-${TMPDIR:-/tmp}/was-pg-test}"
DIR="${DIR%/}"
if [[ -z "${PG_BIN:-}" ]]; then
  for candidate in /opt/homebrew/opt/postgresql@18/bin /opt/homebrew/opt/postgresql@17/bin /opt/homebrew/opt/postgresql@15/bin /usr/local/opt/postgresql@18/bin /usr/lib/postgresql/18/bin; do
    if [[ -x "$candidate/pg_ctl" ]]; then PG_BIN="$candidate"; break; fi
  done
fi
PG_BIN="${PG_BIN:-$(dirname "$(command -v pg_ctl 2>/dev/null || echo /nonexistent/pg_ctl)")}"

DATA="$DIR/data"
if [[ -f "$DATA/PG_VERSION" ]] && "$PG_BIN/pg_ctl" -D "$DATA" status >/dev/null 2>&1; then
  "$PG_BIN/pg_ctl" -D "$DATA" -m fast -w stop
fi
# Only ever delete a directory that is a cluster made by the start script.
if [[ "${1:-}" != "--keep" && -f "$DATA/PG_VERSION" ]]; then
  rm -rf "$DIR"
  echo "removed $DIR"
fi
