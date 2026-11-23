import { z } from 'zod';

import { unsetIfEmpty } from './env.helper';

const flag = z.enum(['0', '1', 'true', 'false']).transform((v) => v === '1' || v === 'true');

/** Environment of the server (see BACKEND.md). Everything has a dev default: `pnpm dev` needs no .env. */
export const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  HOST: z.string().default('127.0.0.1'),
  /** Postgres URL (node-postgres). Unset = embedded PGlite. */
  DATABASE_URL: z.string().optional(),
  /** node-postgres pool: connections per process, statement timeout and wait for a connection (ms). */
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  DB_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  /** Largest accepted request body on /api, in KB (JSON forms are a few KB). */
  BODY_LIMIT_KB: z.coerce.number().int().positive().default(64),
  /** A page render that has not produced its response after this many ms answers 503 instead of hanging. */
  SSR_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  /** Image proxy (/img/wm): in-process cache of Wikimedia thumbnails (MB, 0 = none) and upstream timeout (ms). */
  IMAGE_PROXY_CACHE_MB: z.coerce.number().int().min(0).default(64),
  IMAGE_PROXY_TIMEOUT_MS: z.coerce.number().int().positive().default(8_000),
  /** PGlite dir (relative to the repo root) or `memory://`. Default `.data/pglite`. */
  PGLITE_DATA_DIR: z.string().optional(),
  /** Comma-separated origins allowed by CORS on /api (pages are same-origin: the server itself). */
  CORS_ORIGINS: z.string().default('http://localhost:8787,http://127.0.0.1:8787'),
  /** Salt of ip_hash (suggestions, contact, audit). Required in production (16+ characters); dev uses a fixed value. */
  IP_HASH_SALT: unsetIfEmpty(z.string()),
  RATE_LIMIT_ENABLED: flag.default(true),
  /** Where rate-limit counters live: `database` (shared by every instance) or `memory` (one process). Default: database
   * in production or with DATABASE_URL, memory otherwise. */
  RATE_LIMIT_STORE: unsetIfEmpty(z.enum(['memory', 'database'])),
  /** Minutes between cleanups of expired auth sessions/verifications and rate-limit windows (0 = off). */
  CLEANUP_INTERVAL_MINUTES: z.coerce.number().nonnegative().default(60),
  /** Fase 13: autonomous collection every N months (0 = off). */
  INGEST_SCHEDULE_MONTHS: z.coerce.number().nonnegative().default(6),
  LOG_REQUESTS: flag.default(true),
  /** `json` (one object per line, production default) or `text` (dev default). */
  LOG_FORMAT: unsetIfEmpty(z.enum(['text', 'json'])),
  /** Requests slower than this (ms) are logged as `warn` even with LOG_REQUESTS=0. */
  SLOW_REQUEST_MS: z.coerce.number().int().positive().default(1_000),
  /** OpenTelemetry traces (OTLP/HTTP) are sent when this is set (e.g. http://collector:4318); off by default. */
  OTEL_EXPORTER_OTLP_ENDPOINT: unsetIfEmpty(z.url()),
  /** `console` prints the spans (dev check of the tracing). */
  OTEL_TRACES_EXPORTER: z.string().optional(),
  /** D12: publish a calculated snapshot automatically when the reproducibility gate passes (true in production). */
  RANKING_AUTO_PUBLISH: flag.default(false),
  /** Apply pending migrations on boot (the app starts on an empty database). */
  MIGRATE_ON_BOOT: flag.default(true),
  /** Dev: Vite in middleware mode inside this process (SSR + HMR on the same port). `pnpm dev` sets it. */
  WEB_DEV: flag.default(false),
  /** Production web build (apps/web/dist: client/ + server/entry-server.js), relative to the repo root. */
  WEB_DIST_DIR: z.string().default('apps/web/dist'),
  /** Time zone of "today" in the pages (calendar, on this day, ages). */
  APP_TIME_ZONE: z
    .string()
    .default('America/Sao_Paulo')
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, 'invalid IANA time zone'),
  /** Production: seconds an anonymous page stays in the in-process HTML cache (0 = off). Dropped on writes to what public pages show (catalog, comments, votes). */
  SSR_CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(60),
  /** Public origin of the site (canonical and Open Graph URLs). Default http://localhost:<PORT>. */
  PUBLIC_URL: z.url().optional(),
  NODE_ENV: z.string().optional(),
  /** Origin Better Auth builds its URLs from (Google callback = <this>/api/auth/callback/google). Default PUBLIC_URL. */
  BETTER_AUTH_URL: unsetIfEmpty(z.url()),
  /** Signs/encrypts the session cookies and OAuth tokens. Required in production (dev uses a fixed dev-only value). */
  BETTER_AUTH_SECRET: unsetIfEmpty(z.string().min(32, 'BETTER_AUTH_SECRET must have at least 32 characters')),
  /** Google OAuth client ("Web application"). Both unset = Google sign-in disabled (the app still boots). */
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  /** Comma-separated e-mails promoted to admin on boot and on sign-up (audited). */
  ADMIN_EMAILS: z.string().default(''),
  /** Dev session switcher (anon/reader/admin demo accounts). Default on outside production; forbidden in production. */
  AUTH_SIMULATED: unsetIfEmpty(flag),
});

/** Dev-only values (never used in production: loadConfig requires BETTER_AUTH_SECRET and IP_HASH_SALT there). */
export const DEV_IP_HASH_SALT = 'dev-only-salt';
export const DEV_AUTH_SECRET = 'dev-only-better-auth-secret-not-for-production-0000';
