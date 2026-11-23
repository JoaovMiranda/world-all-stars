import path from 'node:path';

import { findRepoRoot } from '@was/db';

import { DEV_AUTH_SECRET, DEV_IP_HASH_SALT, EnvSchema } from './env.const';
import type { ServerConfig } from './server-config.type';

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): ServerConfig => {
  const e = EnvSchema.parse(env);
  const dir = e.PGLITE_DATA_DIR;
  const production = e.NODE_ENV === 'production';
  if (production && e.AUTH_SIMULATED) throw new Error('AUTH_SIMULATED is forbidden in production (NODE_ENV=production): it lets anyone act as the demo admin.');
  const google = e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET ? { clientId: e.GOOGLE_CLIENT_ID, clientSecret: e.GOOGLE_CLIENT_SECRET } : null;
  if (production && !e.BETTER_AUTH_SECRET)
    throw new Error('BETTER_AUTH_SECRET is required in production (NODE_ENV=production): 32+ random characters (openssl rand -base64 32).');
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
    corsOrigins: e.CORS_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    ipHashSalt: e.IP_HASH_SALT ?? DEV_IP_HASH_SALT,
    rateLimitEnabled: e.RATE_LIMIT_ENABLED,
    rateLimitStore: e.RATE_LIMIT_STORE ?? (production || e.DATABASE_URL ? 'database' : 'memory'),
    cleanupIntervalMinutes: e.CLEANUP_INTERVAL_MINUTES,
    ingestScheduleMonths: e.INGEST_SCHEDULE_MONTHS,
    logRequests: e.LOG_REQUESTS,
    logFormat: e.LOG_FORMAT ?? (production ? 'json' : 'text'),
    slowRequestMs: e.SLOW_REQUEST_MS,
    otelEndpoint: e.OTEL_EXPORTER_OTLP_ENDPOINT ?? (env.OTEL_TRACES_EXPORTER === 'console' ? 'console' : null),
    rankingAutoPublish: e.RANKING_AUTO_PUBLISH,
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
    adminEmails: e.ADMIN_EMAILS.split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  };
};
