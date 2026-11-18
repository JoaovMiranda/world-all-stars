// Pages vs API on one server: CSP split, in-process API calls, HTML cache policy (ETag/304/LRU), SEO files.
import { createDatabase, type DatabaseHandle, findRepoRoot, seedDatabase, users } from '@was/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../app';
import { loadConfig } from '../config/env.config';
import { PRIVATE_HTML_CACHE_CONTROL, PUBLIC_HTML_CACHE_CONTROL } from '../web/html-cache';
import type { WebRuntime } from '../web/web-handler';
import { HAS_PROTOTYPE } from './test-app.helper';

describe('web pages mounted on the API server', () => {
  let handle: DatabaseHandle;
  let created: ReturnType<typeof createApp>;
  const seen = { renders: 0, nonce: '', apiStatus: 0, ssrHeader: '' };

  beforeAll(async () => {
    handle = await createDatabase({ pgliteDataDir: 'memory://' });
    await handle.migrate();
    if (HAS_PROTOTYPE) await seedDatabase(handle.db, findRepoRoot());
    const web: WebRuntime = {
      dev: false,
      assets: async () => ({ scripts: [], css: [], preloads: [] }),
      loadRenderer: async () => ({
        async render({ request, nonce, apiFetch }) {
          seen.renders += 1;
          seen.nonce = nonce;
          seen.apiStatus = (await apiFetch(new Request('http://ssr.internal/api/health'))).status;
          const status = new URL(request.url).pathname === '/nao-existe' ? 404 : 200;
          return new Response(`<!DOCTYPE html><html><body><script nonce="${nonce}"></script></body></html>`, { status, headers: { 'content-type': 'text/html; charset=UTF-8' } });
        },
      }),
    };
    created = createApp({ db: handle.db, config: { ...loadConfig({}), logRequests: false, publicUrl: 'https://example.org' }, web });
  });
  afterAll(() => handle.close());
  const app = () => created.app;

  it('renders pages with a per-request nonce CSP and calls the API in-process', async () => {
    const res = await app().request('/sports');
    expect(res.status).toBe(200);
    const csp = res.headers.get('content-security-policy') ?? '';
    expect(csp).toContain(`script-src 'self' 'nonce-${seen.nonce}'`);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(await res.text()).toContain(`nonce="${seen.nonce}"`);
    expect(seen.apiStatus).toBe(200);
  });

  it("keeps default-src 'none' on /api and never renders a page for an unknown /api path", async () => {
    const health = await app().request('/api/health');
    expect(health.headers.get('content-security-policy')).toContain("default-src 'none'");
    const missing = await app().request('/api/nao-existe');
    expect(missing.status).toBe(404);
    expect(missing.headers.get('content-type')).toContain('application/json');
  });

  it('anonymous pages: public cache headers, ETag, 304, served from the in-process cache with their own nonce', async () => {
    created.htmlCache.clear();
    const before = seen.renders;
    const first = await app().request('/athletes');
    expect(first.headers.get('cache-control')).toBe(PUBLIC_HTML_CACHE_CONTROL);
    expect(first.headers.get('vary')).toContain('Cookie');
    const etag = first.headers.get('etag') ?? '';
    expect(etag).toMatch(/^W\/".+"$/);
    const body = await first.text();

    const again = await app().request('/athletes');
    expect(seen.renders).toBe(before + 1); // cache hit
    expect(await again.text()).toBe(body);
    expect(again.headers.get('content-security-policy')).toBe(first.headers.get('content-security-policy'));

    const notModified = await app().request('/athletes', { headers: { 'if-none-match': etag } });
    expect(notModified.status).toBe(304);
    expect(await notModified.text()).toBe('');
  });

  it('personalized, private and error pages stay private and are not cached', async () => {
    created.htmlCache.clear();
    for (const [path, init] of [
      ['/athletes', { headers: { cookie: 'was_session=reader' } }],
      // Better Auth (Google sign-in) cookies: signed in = personal page, never in the shared/in-process cache.
      ['/athletes', { headers: { cookie: 'was.session_token=abc.def' } }],
      ['/athletes', { headers: { cookie: '_ga=1; __Secure-was.session_token=abc.def' } }],
      ['/athletes', { headers: { cookie: 'other=1; was-theme=dark' } }],
      ['/athletes?as=admin', {}],
      ['/?fixture=empty', {}],
      ['/admin', {}],
      ['/me/data', {}],
      ['/nao-existe', {}],
    ] as const) {
      const res = await app().request(path, init);
      expect(res.headers.get('cache-control'), path).toBe(PRIVATE_HTML_CACHE_CONTROL);
      expect(res.headers.get('etag'), path).toBeNull();
    }
    expect(created.htmlCache.size).toBe(0);
    // Unrelated cookies do not make a page personal.
    const shared = await app().request('/athletes', { headers: { cookie: '_ga=1' } });
    expect(shared.headers.get('cache-control')).toBe(PUBLIC_HTML_CACHE_CONTROL);
  });

  it('drops the HTML cache on any database write', async () => {
    await app().request('/sports');
    expect(created.htmlCache.size).toBeGreaterThan(0);
    await created.deps.repo.insert(users, { email: `cache-${Date.now()}@exemplo.invalid`, displayName: 'Cache' } as never, { userId: null, name: null, via: 'system', ipHash: null, userAgent: null } as never);
    expect(created.htmlCache.size).toBe(0);
  });

  it('serves robots.txt and the sitemaps with absolute PUBLIC_URL links', async () => {
    const robots = await (await app().request('/robots.txt')).text();
    expect(robots).toContain('Disallow: /admin');
    expect(robots).toContain('Disallow: /api/');
    expect(robots).toContain('Sitemap: https://example.org/sitemap.xml');

    const index = await app().request('/sitemap.xml');
    expect(index.headers.get('content-type')).toContain('application/xml');
    const indexXml = await index.text();
    for (const p of ['static', 'athletes', 'sports']) expect(indexXml).toContain(`<loc>https://example.org/sitemaps/${p}.xml</loc>`);

    const staticXml = await (await app().request('/sitemaps/static.xml')).text();
    expect(staticXml).toContain('<loc>https://example.org/</loc>');
    expect(staticXml).toContain('<loc>https://example.org/legal/terms</loc>');
    expect(staticXml).not.toContain('/admin');
  });

  it.skipIf(!HAS_PROTOTYPE)('lists catalog athletes and sports with lastmod', async () => {
    const athletes = await (await app().request('/sitemaps/athletes.xml')).text();
    expect(athletes).toMatch(/<url><loc>https:\/\/example\.org\/athletes\/pele<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod><\/url>/);
    const sports = await (await app().request('/sitemaps/sports.xml')).text();
    expect(sports).toContain('<loc>https://example.org/sports/futebol</loc>');
  });
});
