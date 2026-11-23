import { createDatabase, findRepoRoot, seedDatabase } from '@was/db';
import { buildApiPath, buildQueryString } from '@was/shared';

import { createApp } from '../app';
import { SESSION_HEADER } from '../auth/simulated-auth.const';
import { loadConfig } from '../config/env.config';
import type { TestApp } from './test-app.interface';

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
