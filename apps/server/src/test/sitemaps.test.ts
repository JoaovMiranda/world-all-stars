// T4.7 sitemaps: the index lists every per-type sitemap; each one is well-formed XML of the sitemap protocol (image
// extension included) with absolute PUBLIC_URL locations and day lastmods; every listed page answers 200. Pages are
// rendered by a stub that resolves each page path to the API endpoint the real page loads (404 when the entity is
// missing), so "answers 200" means the page's data exists, without building the web app.
import { createDatabase, type DatabaseHandle, findRepoRoot, seedDatabase } from '@was/db';
import { SITEMAP_PATHS } from '@was/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../app';
import { loadConfig } from '../config/env.config';
import type { WebRuntime } from '../web/web-runtime.interface';
import { HAS_PROTOTYPE } from './test-app.const';

const ORIGIN = 'https://example.org';
const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const IMAGE_NS = 'http://www.google.com/schemas/sitemap-image/1.1';

/** Page path → API path of the data the page needs (null: a static page that always renders). */
const API_OF_PAGE: [RegExp, (m: RegExpExecArray) => string][] = [
  [/^\/athletes\/([^/]+)$/, (m) => `/api/athletes/${m[1]}`],
  [/^\/sports\/([^/]+)$/, (m) => `/api/sports/${m[1]}`],
  [/^\/competitions\/([^/]+)$/, (m) => `/api/competitions/${m[1]}`],
  [/^\/competitions\/([^/]+)\/([^/]+)$/, (m) => `/api/competitions/${m[1]}/editions/${m[2]}`],
  [/^\/rankings$/, () => '/api/rankings'],
  [/^\/rankings\/all-sports$/, () => '/api/rankings/all-sports'],
  [/^\/rankings\/all-sports\/methodology$/, () => '/api/rankings/all-sports/methodology'],
  [/^\/rankings\/([^/]+)\/methodology$/, (m) => `/api/ranking-methodologies/${m[1]}`],
  [/^\/rankings\/([^/]+)$/, (m) => `/api/rankings/${m[1]}`],
  [/^\/on-this-day\/(\d{2}-\d{2})$/, (m) => `/api/today/${m[1]}`],
];
const apiPathOf = (pagePath: string): string | null => {
  for (const [re, api] of API_OF_PAGE) {
    const m = re.exec(pagePath);
    if (m) return api(m);
  }
  return null;
};

interface XmlElement {
  name: string;
  attrs: Record<string, string>;
  children: XmlElement[];
  text: string;
}

/**
 * Minimal well-formedness check + tree (no DTDs, comments or CDATA, which sitemaps never need): one XML declaration,
 * balanced tags, quoted attributes, only the five predefined entities, a single root.
 */
const parseXml = (source: string): XmlElement => {
  expect(source.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  const body = source.replace(/^<\?xml[^?]*\?>/, '');
  const stack: XmlElement[] = [{ name: '#document', attrs: {}, children: [], text: '' }];
  const token = /<(\/?)([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+="[^"<]*")*)\s*(\/?)>|([^<]+)/gy;
  let consumed = 0;
  for (let m = token.exec(body); m; m = token.exec(body)) {
    consumed = token.lastIndex;
    const [, closing, name, rawAttrs, selfClosing, text] = m;
    const top = stack.at(-1)!;
    if (text !== undefined) {
      expect(text.replace(/&(amp|lt|gt|quot|apos);/g, ''), 'only predefined entities').not.toMatch(/[&<>]/);
      if (text.trim())
        top.text += text
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&amp;/g, '&');
      continue;
    }
    if (closing) {
      expect(top.name, `closing </${name}>`).toBe(name);
      stack.pop();
      continue;
    }
    const attrs = Object.fromEntries([...(rawAttrs ?? '').matchAll(/([\w:.-]+)="([^"]*)"/g)].map((a) => [a[1]!, a[2]!]));
    const el: XmlElement = { name: name!, attrs, children: [], text: '' };
    top.children.push(el);
    if (!selfClosing) stack.push(el);
  }
  expect(consumed, 'the whole document is markup or text').toBe(body.length);
  expect(stack.length, 'every element is closed').toBe(1);
  const roots = stack[0]!.children;
  expect(roots.length, 'a single root element').toBe(1);
  return roots[0]!;
};

const child = (el: XmlElement, name: string) => el.children.filter((c) => c.name === name);
const absolute = (loc: string) => {
  expect(loc.startsWith(`${ORIGIN}/`), loc).toBe(true);
  return loc.slice(ORIGIN.length);
};
const checkLastmod = (el: XmlElement) => {
  const lastmod = child(el, 'lastmod');
  expect(lastmod.length).toBeLessThanOrEqual(1);
  if (lastmod[0]) expect(lastmod[0].text).toMatch(/^\d{4}-\d{2}-\d{2}$/);
};

describe('sitemaps (T4.7)', () => {
  let handle: DatabaseHandle;
  let created: ReturnType<typeof createApp>;

  beforeAll(async () => {
    handle = await createDatabase({ pgliteDataDir: 'memory://' });
    await handle.migrate();
    if (HAS_PROTOTYPE) await seedDatabase(handle.db, findRepoRoot());
    const web: WebRuntime = {
      dev: false,
      assets: async () => ({ scripts: [], css: [], preloads: [] }),
      loadRenderer: async () => ({
        async render({ request, apiFetch }) {
          const api = apiPathOf(new URL(request.url).pathname);
          const status = api ? (await apiFetch(new Request(`http://ssr.internal${api}`))).status : 200;
          return new Response('<!DOCTYPE html><html lang="pt-BR"><body><h1>page</h1></body></html>', {
            status: status === 200 ? 200 : 404,
            headers: { 'content-type': 'text/html; charset=UTF-8' },
          });
        },
      }),
    };
    created = createApp({ db: handle.db, config: { ...loadConfig({}), logRequests: false, publicUrl: ORIGIN }, web });
  }, 120_000);
  afterAll(() => handle.close());
  const app = () => created.app;
  const fetchXml = async (path: string) => {
    const res = await app().request(path);
    expect(res.status, path).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/xml');
    return parseXml(await res.text());
  };

  it('the index lists every per-type sitemap with absolute URLs', async () => {
    const index = await fetchXml(SITEMAP_PATHS.index);
    expect(index.name).toBe('sitemapindex');
    expect(index.attrs.xmlns).toBe(SITEMAP_NS);
    const listed = child(index, 'sitemap').map((s) => {
      checkLastmod(s);
      return absolute(child(s, 'loc')[0]!.text);
    });
    const { index: _index, ...perType } = SITEMAP_PATHS;
    expect(listed.sort()).toEqual(Object.values(perType).sort());
  });

  it('every sitemap is valid and every listed page answers 200', async () => {
    const pages = new Set<string>();
    for (const [key, path] of Object.entries(SITEMAP_PATHS)) {
      if (key === 'index') continue;
      const urlset = await fetchXml(path);
      expect(urlset.name, path).toBe('urlset');
      expect(urlset.attrs.xmlns).toBe(SITEMAP_NS);
      if (path === SITEMAP_PATHS.images) expect(urlset.attrs['xmlns:image']).toBe(IMAGE_NS);
      const urls = child(urlset, 'url');
      expect(urls.length).toBeLessThanOrEqual(50_000);
      for (const url of urls) {
        const locs = child(url, 'loc');
        expect(locs.length).toBe(1);
        checkLastmod(url);
        pages.add(absolute(locs[0]!.text));
        for (const image of child(url, 'image:image')) {
          expect(child(image, 'image:loc')[0]?.text).toMatch(/^https:\/\//);
          for (const license of child(image, 'image:license')) expect(license.text).toMatch(/^https:\/\//);
        }
      }
    }
    expect(pages.has('/rankings/all-sports')).toBe(true);
    const failures: string[] = [];
    for (const page of pages) {
      const res = await app().request(page);
      if (res.status !== 200) failures.push(`${page} → ${res.status}`);
    }
    expect(failures).toEqual([]);
  }, 180_000);

  it.skipIf(!HAS_PROTOTYPE)('lists competitions with their editions, licensed images and on-this-day pages', async () => {
    const competitions = await (await app().request(SITEMAP_PATHS.competitions)).text();
    expect(competitions).toContain(`<loc>${ORIGIN}/competitions/fifa-world-cup</loc>`);
    expect(competitions).toMatch(/<loc>https:\/\/example\.org\/competitions\/fifa-world-cup\/1958<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
    const images = await (await app().request(SITEMAP_PATHS.images)).text();
    expect(images).toMatch(/<url><loc>https:\/\/example\.org\/athletes\/[^<]+<\/loc>(<lastmod>[^<]+<\/lastmod>)?<image:image><image:loc>https:\/\//);
    expect(images).toContain('<image:license>https://creativecommons.org/licenses/');
    const today = await (await app().request(SITEMAP_PATHS.today)).text();
    expect(today).toMatch(/<loc>https:\/\/example\.org\/on-this-day\/\d{2}-\d{2}<\/loc>/);
  });

  it('an unknown competition or edition page is a 404', async () => {
    expect((await app().request('/competitions/no-such-competition')).status).toBe(404);
    expect((await app().request('/api/competitions/no-such-competition/editions/1900')).status).toBe(404);
  });
});
