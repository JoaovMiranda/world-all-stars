// Pages vs API on one server: CSP split, in-process API calls from the renderer, /api never falls through to SSR.
import { createDatabase, type DatabaseHandle } from '@was/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../app';
import { loadConfig } from '../config/env.config';
import type { WebRuntime } from '../web/web-handler';

describe('web pages mounted on the API server', () => {
  let handle: DatabaseHandle;
  let app: ReturnType<typeof createApp>['app'];
  const seen: { nonce?: string; apiStatus?: number } = {};

  beforeAll(async () => {
    handle = await createDatabase({ pgliteDataDir: 'memory://' });
    await handle.migrate();
    const web: WebRuntime = {
      dev: false,
      assets: async () => ({ scripts: [], css: [], preloads: [] }),
      loadRenderer: async () => ({
        async render({ nonce, apiFetch }) {
          seen.nonce = nonce;
          seen.apiStatus = (await apiFetch(new Request('http://ssr.internal/api/health'))).status;
          return new Response(`<!DOCTYPE html><html><body><script nonce="${nonce}"></script></body></html>`, { headers: { 'content-type': 'text/html; charset=UTF-8' } });
        },
      }),
    };
    ({ app } = createApp({ db: handle.db, config: { ...loadConfig({}), logRequests: false }, web }));
  });
  afterAll(() => handle.close());

  it('renders pages with a per-request nonce CSP and calls the API in-process', async () => {
    const res = await app.request('/athletes/pele');
    expect(res.status).toBe(200);
    const csp = res.headers.get('content-security-policy') ?? '';
    expect(csp).toContain(`script-src 'self' 'nonce-${seen.nonce}'`);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(await res.text()).toContain(`nonce="${seen.nonce}"`);
    expect(seen.apiStatus).toBe(200);
    const first = seen.nonce as string;
    const other = await app.request('/');
    expect(other.headers.get('content-security-policy')).not.toContain(first);
  });

  it("keeps default-src 'none' on /api and never renders a page for an unknown /api path", async () => {
    const health = await app.request('/api/health');
    expect(health.headers.get('content-security-policy')).toContain("default-src 'none'");
    const missing = await app.request('/api/nao-existe');
    expect(missing.status).toBe(404);
    expect(missing.headers.get('content-type')).toContain('application/json');
  });
});
