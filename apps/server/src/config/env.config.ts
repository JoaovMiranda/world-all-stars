import path from 'node:path';

import { findRepoRoot } from '@was/db';
import { z } from 'zod';

const flag = z.enum(['0', '1', 'true', 'false']).transform((v) => v === '1' || v === 'true');

/** Environment of the server (see BACKEND.md). Everything has a dev default: `pnpm dev` needs no .env. */
const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  HOST: z.string().default('127.0.0.1'),
  /** Postgres URL (node-postgres). Unset = embedded PGlite. */
  DATABASE_URL: z.string().optional(),
  /** PGlite dir (relative to the repo root) or `memory://`. Default `.data/pglite`. */
  PGLITE_DATA_DIR: z.string().optional(),
  /** Comma-separated origins allowed by CORS (the Vite dev server). */
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  /** Salt of ip_hash (suggestions, contact, audit). Set a secret in production. */
  IP_HASH_SALT: z.string().default('dev-only-salt'),
  RATE_LIMIT_ENABLED: flag.default(true),
  LOG_REQUESTS: flag.default(true),
  /** Apply pending migrations on boot (the app starts on an empty database). */
  MIGRATE_ON_BOOT: flag.default(true),
});

export type ServerConfig = {
  port: number;
  host: string;
  databaseUrl: string | undefined;
  pgliteDataDir: string | undefined;
  corsOrigins: string[];
  ipHashSalt: string;
  rateLimitEnabled: boolean;
  logRequests: boolean;
  migrateOnBoot: boolean;
};

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): ServerConfig => {
  const e = EnvSchema.parse(env);
  const dir = e.PGLITE_DATA_DIR;
  return {
    port: e.PORT,
    host: e.HOST,
    databaseUrl: e.DATABASE_URL || undefined,
    pgliteDataDir: dir ? (dir.startsWith('memory://') ? dir : path.resolve(findRepoRoot(), dir)) : undefined,
    corsOrigins: e.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
    ipHashSalt: e.IP_HASH_SALT,
    rateLimitEnabled: e.RATE_LIMIT_ENABLED,
    logRequests: e.LOG_REQUESTS,
    migrateOnBoot: e.MIGRATE_ON_BOOT,
  };
};
