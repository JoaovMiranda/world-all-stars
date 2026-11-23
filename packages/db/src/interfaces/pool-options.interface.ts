export interface PoolOptions {
  /** Connections per process (Neon free/pooler: keep processes × max under the plan's limit). Default 10. */
  max?: number;
  /** Server-side cap of one statement (Postgres `statement_timeout`), ms. Default 10 000. */
  statementTimeoutMs?: number;
  /** Waiting for a free/new connection, ms. Default 5 000 (fail fast instead of piling up requests). */
  connectionTimeoutMs?: number;
  /** Idle connection closed after, ms. Default 30 000. */
  idleTimeoutMs?: number;
}
