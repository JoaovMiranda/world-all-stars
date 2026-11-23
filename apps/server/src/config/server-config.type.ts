import type { RateLimitStoreKind } from '../rate-limit/rate-limit-store-kind.type';

/** Validated server configuration (loadConfig). */
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
  /** D12: auto-publish validated snapshots (RANKING_AUTO_PUBLISH). */
  rankingAutoPublish: boolean;
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
