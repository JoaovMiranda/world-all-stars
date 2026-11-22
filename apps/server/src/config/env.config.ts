import path from 'node:path';

import { findRepoRoot } from '@was/db';
import { z } from 'zod';

import type { RateLimitStoreKind } from '../rate-limit/rate-limit.store';

const flag = z.enum(['0', '1', 'true', 'false']).transform((v) => v === '1' || v === 'true');
/** `VAR=` (empty, as in .env.example) means unset. */
const unsetIfEmpty = <T extends z.ZodType>(schema: T) => z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

/** Environment of the server (see BACKEND.md). Everything has a dev default: `pnpm dev` needs no .env. */
const EnvSchema = z.object({
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
const DEV_IP_HASH_SALT = 'dev-only-salt';
const DEV_AUTH_SECRET = 'dev-only-better-auth-secret-not-for-production-0000';

export type ServerConfig = {
  port: number;
  host: string;
  databaseUrl: string | undefined;
  pgliteDataDir: string | undefined;
  dbPool: { max: number; statementTimeoutMs: number; connectionTimeoutMs: number };
  bodyLimitBytes: number;
  ssrTimeoutMs: number;
  corsOrigins: string[];
  ipHashSalt: string;
  rateLimitEnabled: boolean;
  rateLimitStore: RateLimitStoreKind;
  /** 0 = no periodic cleanup (tests build the config with 0). */
  cleanupIntervalMinutes: number;
  ingestScheduleMonths: number;
  logRequests: boolean;
  logFormat: 'text' | 'json';
  slowRequestMs: number;
  /** OTLP endpoint of the OpenTelemetry collector; null = tracing off. */
  otelEndpoint: string | null;
  migrateOnBoot: boolean;
  webDev: boolean;
  /** Absolute path of the web build. */
  webDistDir: string;
  appTimeZone: string;
  publicUrl: string;
  ssrCacheTtlSeconds: number;
  imageProxy: { cacheBytes: number; timeoutMs: number };
  /** NODE_ENV=production. */
  production: boolean;
  /** Simulated sessions accepted (AUTH_SIMULATED; never in production). */
  authSimulated: boolean;
  betterAuthUrl: string;
  betterAuthSecret: string;
  /** Google OAuth client; null = Google sign-in not configured. */
  google: { clientId: string; clientSecret: string } | null;
  /** Lower-cased. */
  adminEmails: string[];
};

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): ServerConfig => {
  const e = EnvSchema.parse(env);
  const dir = e.PGLITE_DATA_DIR;
  const production = e.NODE_ENV === 'production';
  if (production && e.AUTH_SIMULATED) throw new Error('AUTH_SIMULATED is forbidden in production (NODE_ENV=production): it lets anyone act as the demo admin.');
  const google = e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET ? { clientId: e.GOOGLE_CLIENT_ID, clientSecret: e.GOOGLE_CLIENT_SECRET } : null;
  if (production && !e.BETTER_AUTH_SECRET) throw new Error('BETTER_AUTH_SECRET is required in production (NODE_ENV=production): 32+ random characters (openssl rand -base64 32).');
  if (production && (!e.IP_HASH_SALT || e.IP_HASH_SALT.length < 16 || e.IP_HASH_SALT === DEV_IP_HASH_SALT)) {
    throw new Error('IP_HASH_SALT is required in production (NODE_ENV=production): 16+ random characters, not the dev value.');
  }
  const publicUrl = (e.PUBLIC_URL ?? `http://localhost:${e.PORT}`).replace(/\/+$/, '');
  return {
    port: e.PORT,
    host: e.HOST,
    databaseUrl: e.DATABASE_URL || undefined,
    pgliteDataDir: dir ? (dir.startsWith('memory://') ? dir : path.resolve(findRepoRoot(), dir)) : undefined,
    dbPool: { max: e.DB_POOL_MAX, statementTimeoutMs: e.DB_STATEMENT_TIMEOUT_MS, connectionTimeoutMs: e.DB_CONNECTION_TIMEOUT_MS },
    bodyLimitBytes: e.BODY_LIMIT_KB * 1024,
    ssrTimeoutMs: e.SSR_TIMEOUT_MS,
    corsOrigins: e.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
    ipHashSalt: e.IP_HASH_SALT ?? DEV_IP_HASH_SALT,
    rateLimitEnabled: e.RATE_LIMIT_ENABLED,
    rateLimitStore: e.RATE_LIMIT_STORE ?? (production || e.DATABASE_URL ? 'database' : 'memory'),
    cleanupIntervalMinutes: e.CLEANUP_INTERVAL_MINUTES,
    ingestScheduleMonths: e.INGEST_SCHEDULE_MONTHS,
    logRequests: e.LOG_REQUESTS,
    logFormat: e.LOG_FORMAT ?? (production ? 'json' : 'text'),
    slowRequestMs: e.SLOW_REQUEST_MS,
    otelEndpoint: e.OTEL_EXPORTER_OTLP_ENDPOINT ?? (env.OTEL_TRACES_EXPORTER === 'console' ? 'console' : null),
    migrateOnBoot: e.MIGRATE_ON_BOOT,
    webDev: e.WEB_DEV,
    webDistDir: path.resolve(findRepoRoot(), e.WEB_DIST_DIR),
    appTimeZone: e.APP_TIME_ZONE,
    ssrCacheTtlSeconds: e.SSR_CACHE_TTL_SECONDS,
    imageProxy: { cacheBytes: e.IMAGE_PROXY_CACHE_MB * 1024 * 1024, timeoutMs: e.IMAGE_PROXY_TIMEOUT_MS },
    publicUrl,
    production,
    authSimulated: e.AUTH_SIMULATED ?? !production,
    betterAuthUrl: (e.BETTER_AUTH_URL ?? publicUrl).replace(/\/+$/, ''),
    betterAuthSecret: e.BETTER_AUTH_SECRET ?? DEV_AUTH_SECRET,
    google,
    adminEmails: e.ADMIN_EMAILS.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
  };
};
