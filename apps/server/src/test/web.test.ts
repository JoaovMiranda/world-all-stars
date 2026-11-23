// Pages vs API on one server: CSP split, in-process API calls, HTML cache policy (ETag/304/LRU), SEO files.
import zlib from 'node:zlib';

import { bannedWords, createDatabase, type DatabaseHandle, findRepoRoot, seedDatabase, sources, users } from '@was/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../app';
import { loadConfig } from '../config/env.config';
import { CACHE_CONTROL } from '../consts/cache-control.const';
import type { WebRuntime } from '../web/web-runtime.interface';
import { HAS_PROTOTYPE } from './test-app.const';

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
          return new Response(`<!DOCTYPE html><html><body><script nonce="${nonce}"></script></body></html>`, {
            status,
            headers: { 'content-type': 'text/html; charset=UTF-8' },
          });
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

  it('reports the render time of pages in Server-Timing and marks in-process cache hits', async () => {
    created.htmlCache.clear();
    const miss = await app().request('/hall');
    expect(miss.headers.get('server-timing')).toMatch(/ssr;dur=[\d.]+;desc="render"/);
    expect(miss.headers.get('x-cache')).toBeNull();
    const hit = await app().request('/hall');
    expect(hit.headers.get('x-cache')).toBe('HIT');
    expect(hit.headers.get('server-timing')).not.toContain('ssr;');
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
    expect(first.headers.get('cache-control')).toBe(CACHE_CONTROL.publicHtml);
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
      expect(res.headers.get('cache-control'), path).toBe(CACHE_CONTROL.privateHtml);
      expect(res.headers.get('etag'), path).toBeNull();
    }
    expect(created.htmlCache.size).toBe(0);
    // Unrelated cookies do not make a page personal.
    const shared = await app().request('/athletes', { headers: { cookie: '_ga=1' } });
    expect(shared.headers.get('cache-control')).toBe(CACHE_CONTROL.publicHtml);
  });

  it('drops the HTML cache on writes to what public pages show, keeps it on private writes', async () => {
    const system = { userId: null, name: null, via: 'system', ipHash: null, userAgent: null } as never;
    await app().request('/sports');
    expect(created.htmlCache.size).toBeGreaterThan(0);
    // Account data never renders on an anonymous page.
    await created.deps.repo.insert(users, { email: `cache-${Date.now()}@exemplo.invalid`, displayName: 'Cache' } as never, system);
    expect(created.htmlCache.size).toBeGreaterThan(0);
    await created.deps.repo.insert(bannedWords, { term: `cache${Date.now()}`, matchMode: 'word', locale: 'pt-BR' } as never, system);
    expect(created.htmlCache.size).toBeGreaterThan(0);
    // Catalog content does.
    await created.deps.repo.insert(
      sources,
      {
        slug: `cache-${Date.now()}`,
        name: 'Cache',
        baseUrl: 'https://cache.invalid',
        originKind: 'official',
        commercialUse: 'no',
        usageStatus: 'link_only',
      } as never,
      system,
    );
    expect(created.htmlCache.size).toBe(0);
  });

  it('compresses pages and API JSON (brotli preferred, gzip fallback), never in-process API calls', async () => {
    const decode = async (res: Response) => {
      const bytes = Buffer.from(await res.arrayBuffer());
      const enc = res.headers.get('content-encoding');
      return (enc === 'br' ? zlib.brotliDecompressSync(bytes) : enc === 'gzip' ? zlib.gunzipSync(bytes) : bytes).toString('utf8');
    };
    const br = await app().request('/sports', { headers: { 'accept-encoding': 'gzip, deflate, br' } });
    expect(br.headers.get('content-encoding')).toBe('br');
    expect(br.headers.get('vary')).toContain('Accept-Encoding');
    expect(br.headers.get('content-length')).toBeNull();
    expect(await decode(br)).toContain('<!DOCTYPE html>');

    const gz = await app().request('/sitemaps/static.xml', { headers: { 'accept-encoding': 'gzip' } });
    expect(gz.headers.get('content-encoding')).toBe('gzip');
    expect(await decode(gz)).toContain('<urlset');

    const refused = await app().request('/sports', { headers: { 'accept-encoding': 'br;q=0, identity' } });
    expect(refused.headers.get('content-encoding')).toBeNull();

    const ssr = await app().request('/api/health', { headers: { 'accept-encoding': 'br', 'x-was-ssr': '1' } });
    expect(ssr.headers.get('content-encoding')).toBeNull();
    expect(await ssr.json()).toEqual({ ok: true, db: 'up' });
    expect(ssr.headers.get('server-timing')).toMatch(/total;dur=[\d.]+;desc="server"/);

    const notModified = await app().request('/sports', { headers: { 'accept-encoding': 'br', 'if-none-match': br.headers.get('etag') ?? '' } });
    expect(notModified.status).toBe(304);
    expect(notModified.headers.get('content-encoding')).toBeNull();
  });

  it('refuses API bodies above BODY_LIMIT_KB with a 413 in the API error shape', async () => {
    const res = await app().request('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'x'.repeat(70 * 1024) }),
    });
    expect(res.status).toBe(413);
    expect(await res.json()).toMatchObject({ error: 'payload_too_large' });
  });

  it('accepts anonymous Web Vitals beacons (RUM) and logs one JSON line per metric', async () => {
    const lines: string[] = [];
    const log = console.log;
    console.log = (line: string) => void lines.push(line);
    try {
      const metrics = [
        { name: 'LCP', value: 2310.5, rating: 'good', path: '/athletes/pele', navigationType: 'navigate', connection: '4g' },
        { name: 'CLS', value: 0.31, rating: 'poor', path: '/athletes/pele' },
      ];
      const res = await app().request('/api/vitals', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ metrics }) });
      expect(res.status).toBe(200);
    } finally {
      console.log = log;
    }
    const vitals = lines.filter((l) => l.includes('"web-vital"')).map((l) => JSON.parse(l));
    expect(vitals).toMatchObject([
      { name: 'LCP', value: 2310.5, rating: 'good', level: 'info', conn: '4g' },
      { name: 'CLS', rating: 'poor', level: 'warn' },
    ]);
    const bad = await app().request('/api/vitals', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ metrics: [{ name: 'XYZ', value: -1, rating: 'good', path: 'x' }] }),
    });
    expect(bad.status).toBe(422);
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

  it.skipIf(!HAS_PROTOTYPE)('old Portuguese slugs answer 301 to the English URL (handoff v3 §11)', async () => {
    const old = await app().request('/sports/futebol?tab=x');
    expect(old.status).toBe(301);
    expect(old.headers.get('location')).toBe('/sports/football?tab=x');
    expect((await app().request('/sports/football')).status).toBe(200);
  });

  it.each([
    ['/athletes/pele?tab=comentarios', '/athletes/pele?tab=comments'],
    ['/contact?tipo=mensagem', '/contact?type=message'],
    ['/me/notifications?filtro=nao-lidas', '/me/notifications?filter=unread'],
  ])('old Portuguese query keys/values answer 301 (D35): %s', async (old, next) => {
    const res = await app().request(old);
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe(next);
  });

  it.skipIf(!HAS_PROTOTYPE)('lists catalog athletes and sports with lastmod', async () => {
    const athletes = await (await app().request('/sitemaps/athletes.xml')).text();
    expect(athletes).toMatch(/<url><loc>https:\/\/example\.org\/athletes\/pele<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod><\/url>/);
    const sports = await (await app().request('/sitemaps/sports.xml')).text();
    expect(sports).toContain('<loc>https://example.org/sports/football</loc>');
  });
});
