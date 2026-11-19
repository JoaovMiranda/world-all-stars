import fs from 'node:fs';
import path from 'node:path';

import { createDatabase, type DatabaseHandle, findRepoRoot, seedDatabase } from '@was/db';
import { type ApiContract, type SessionKind, buildApiPath, buildQueryString } from '@was/shared';

import { createApp } from '../app';
import { SESSION_HEADER } from '../auth/simulated-auth.provider';
import { loadConfig } from '../config/env.config';

export const HAS_PROTOTYPE = fs.existsSync(path.join(findRepoRoot(), 'plan/front-prototype/mock'));

export interface TestApp {
  handle: DatabaseHandle;
  app: ReturnType<typeof createApp>['app'];
  /** The app's dependencies (db, repository with its cache hooks…) for service-level tests. */
  deps: ReturnType<typeof createApp>['deps'];
  /** Calls an endpoint BY ITS CONTRACT (same path builder as the web http client). */
  call(contract: ApiContract, input?: { params?: Record<string, unknown>; query?: Record<string, unknown>; body?: unknown }, as?: SessionKind): Promise<{ status: number; json: any }>;
  close(): Promise<void>;
}

/** In-memory PGlite + migrations (+ the prototype seed when `seed`), the real app, no network. */
export const createTestApp = async ({ seed = true, rateLimit = false } = {}): Promise<TestApp> => {
  const handle = await createDatabase({ pgliteDataDir: 'memory://' });
  await handle.migrate();
  if (seed) await seedDatabase(handle.db, findRepoRoot());
  const config = { ...loadConfig({}), rateLimitEnabled: rateLimit, logRequests: false };
  const { app, deps } = createApp({ db: handle.db, config });
  return {
    handle,
    app,
    deps,
    async call(contract, input = {}, as) {
      const url = `${buildApiPath(contract.path, input.params)}${buildQueryString(input.query)}`;
      const res = await app.request(url, {
        method: contract.method,
        headers: { 'content-type': 'application/json', ...(as ? { [SESSION_HEADER]: as } : {}) },
        ...(input.body !== undefined ? { body: JSON.stringify(input.body) } : {}),
      });
      return { status: res.status, json: await res.json().catch(() => null) };
    },
    close: () => handle.close(),
  };
};
