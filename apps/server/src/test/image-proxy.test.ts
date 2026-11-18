// Same-origin proxy of Wikimedia thumbnails (/img/wm): only valid Commons thumbnails, cached, never an open proxy.
import { createDatabase, type DatabaseHandle } from '@was/db';
import { wikimediaFile } from '@was/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../app';
import { loadConfig } from '../config/env.config';

const ORIGINAL = 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Pele_con_brasil_%28cropped%29.jpg';
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);

describe('image proxy (/img/wm)', () => {
  let handle: DatabaseHandle;
  let app: ReturnType<typeof createApp>['app'];
  const upstream: string[] = [];
  let reply: () => Response = () => new Response(JPEG, { headers: { 'content-type': 'image/jpeg' } });

  beforeAll(async () => {
    handle = await createDatabase({ pgliteDataDir: 'memory://' });
    await handle.migrate();
    const imageFetch = (async (input: string | URL | Request) => {
      upstream.push(String(input));
      return reply();
    }) as typeof fetch;
    app = createApp({ db: handle.db, config: { ...loadConfig({}), logRequests: false }, imageFetch }).app;
  });
  afterAll(() => handle.close());

  const proxied = wikimediaFile(ORIGINAL)!.proxied(500);

  it('builds the proxy path from the Commons URL and serves the exact thumbnail, cached', async () => {
    expect(proxied).toBe('/img/wm/commons/5/5e/Pele_con_brasil_%28cropped%29.jpg/500');
    const first = await app.request(proxied);
    expect(first.status).toBe(200);
    expect(first.headers.get('content-type')).toBe('image/jpeg');
    expect(first.headers.get('cache-control')).toMatch(/public, max-age=\d+/);
    expect(first.headers.get('x-content-type-options')).toBe('nosniff');
    expect(new Uint8Array(await first.arrayBuffer())).toEqual(JPEG);
    expect(upstream).toEqual(['https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Pele_con_brasil_%28cropped%29.jpg/500px-Pele_con_brasil_%28cropped%29.jpg']);

    const second = await app.request(proxied);
    expect(second.status).toBe(200);
    expect(upstream).toHaveLength(1); // served from the in-process cache

    const etag = second.headers.get('etag')!;
    const revalidated = await app.request(proxied, { headers: { 'if-none-match': etag } });
    expect(revalidated.status).toBe(304);
  });

  it.each([
    ['/img/wm/commons/5/5e/Pele.jpg/501', 'a width that is not a pre-rendered step'],
    ['/img/wm/commons/5/6e/Pele.jpg/500', 'a hash directory that does not match'],
    ['/img/wm/commons/5/5e/notes.txt/500', 'a non-image file'],
    ['/img/wm/commons/5/5e/..%2F..%2Fetc%2Fpasswd.jpg/500', 'a path separator in the file name'],
    ['/img/wm/x/5/5e/Pele.jpg/500', 'an invalid project'],
  ])('%s → 404 (%s), nothing fetched', async (path) => {
    const before = upstream.length;
    expect((await app.request(path)).status).toBe(404);
    expect(upstream.length).toBe(before);
  });

  it('answers 404 for a missing file and 502 for an upstream failure or a non-image body', async () => {
    reply = () => new Response('nope', { status: 404 });
    expect((await app.request('/img/wm/commons/a/ab/Missing.jpg/120')).status).toBe(404);
    reply = () => new Response('<html>', { headers: { 'content-type': 'text/html' } });
    const html = await app.request('/img/wm/commons/a/ab/Html.jpg/120');
    expect(html.status).toBe(502);
    expect(html.headers.get('cache-control')).toBe('no-store');
    reply = () => new Response('boom', { status: 503 });
    expect((await app.request('/img/wm/commons/a/ab/Down.png/120')).status).toBe(502);
  });
});
