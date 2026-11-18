import { createHash } from 'node:crypto';

import { commonsFileRef, commonsThumbUrl, IMAGE_PROXY_PREFIX, isWikimediaStep } from '@was/shared';
import type { Context, Hono } from 'hono';

import type { AppDeps, HonoEnv } from '../http/app-context.type';
import { clientIp, hashIp } from '../middlewares/session.middleware';

/**
 * Same-origin proxy of Wikimedia Commons thumbnails: GET /img/wm/<project>/<a>/<ab>/<file>/<width>.
 *
 * Why (doc 12, LCP): the athlete portrait is the largest element of the profile. From upload.wikimedia.org it costs a
 * new DNS + TCP + TLS connection on a slow phone; from our origin it rides the connection the HTML already opened,
 * with a long browser cache and no third-party cookie (Wikimedia sets WMF-Uniq on every image).
 *
 * Safety: not an open proxy. Only Commons thumbnail URLs rebuilt from validated pieces (shared commonsFileRef) at one
 * of the pre-rendered widths are fetched, with a timeout, a size cap and an image content type. Misses are rate
 * limited per IP; hits come from an in-process LRU (bounded by bytes), concurrent misses share one upstream fetch.
 */

export interface ImageProxyOptions {
  /** LRU budget in bytes (0 = no in-process cache: every request goes upstream). */
  cacheBytes: number;
  timeoutMs: number;
  /** Wikimedia's User-Agent policy asks for an identifiable client. */
  userAgent: string;
  /** Replaced in tests. */
  fetch?: typeof fetch;
}

interface CachedImage {
  body: ArrayBuffer;
  type: string;
  etag: string;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
/** Thumbnail URLs never change content in practice; a month in the browser/CDN, revalidated in the background. */
const CACHE_CONTROL = 'public, max-age=2592000, stale-while-revalidate=604800';
const MISS_TTL_MS = 10 * 60_000;

/** Byte-bounded LRU (Map keeps insertion order: re-inserting on read makes it most recent). */
class ImageLru {
  private readonly items = new Map<string, CachedImage>();
  private bytes = 0;
  constructor(private readonly budget: number) {}
  get(key: string): CachedImage | undefined {
    const hit = this.items.get(key);
    if (hit) {
      this.items.delete(key);
      this.items.set(key, hit);
    }
    return hit;
  }
  set(key: string, value: CachedImage): void {
    if (value.body.byteLength > this.budget) return;
    this.items.delete(key);
    this.items.set(key, value);
    this.bytes += value.body.byteLength;
    for (const [k, v] of this.items) {
      if (this.bytes <= this.budget) break;
      this.items.delete(k);
      this.bytes -= v.body.byteLength;
    }
  }
}

class UpstreamMissing extends Error {}

const imageResponse = (c: Context<HonoEnv>, image: CachedImage) => {
  const headers = {
    'Content-Type': image.type,
    'Cache-Control': CACHE_CONTROL,
    ETag: image.etag,
    'X-Content-Type-Options': 'nosniff',
    // An image is never a document: nothing in it may run or load anything, even if opened directly.
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'Cross-Origin-Resource-Policy': 'same-site',
  };
  const inm = c.req.header('if-none-match');
  if (inm && inm.split(',').some((t) => t.trim().replace(/^W\//, '') === image.etag.replace(/^W\//, ''))) return c.body(null, 304, headers);
  return c.body(image.body, 200, headers);
};

export const mountImageProxy = (app: Hono<HonoEnv>, deps: Pick<AppDeps, 'rateLimiter' | 'config'>, options: ImageProxyOptions) => {
  const cache = new ImageLru(options.cacheBytes);
  const misses = new Map<string, number>();
  const inflight = new Map<string, Promise<CachedImage>>();
  const doFetch = options.fetch ?? fetch;

  const load = async (url: string): Promise<CachedImage> => {
    const res = await doFetch(url, {
      headers: { 'user-agent': options.userAgent, accept: 'image/avif,image/webp,image/*;q=0.8' },
      redirect: 'error',
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    if (res.status === 404 || res.status === 400) throw new UpstreamMissing();
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const type = res.headers.get('content-type') ?? '';
    const declared = Number(res.headers.get('content-length') ?? 0);
    if (!type.startsWith('image/') || declared > MAX_IMAGE_BYTES) throw new Error('upstream: not an image');
    const body = await res.arrayBuffer();
    if (body.byteLength > MAX_IMAGE_BYTES) throw new Error('upstream: image too large');
    return { body, type, etag: `"${createHash('sha1').update(new Uint8Array(body)).digest('base64url')}"` };
  };

  app.get(`${IMAGE_PROXY_PREFIX}/:project/:a/:ab/:file/:width`, async (c) => {
    const { project, a, ab, file, width } = c.req.param();
    const w = Number(width);
    // Hono hands the params already percent-decoded.
    const ref = isWikimediaStep(w) ? commonsFileRef(project, a, ab, file, false) : null;
    if (!ref) return c.text('Not found', 404);
    const url = commonsThumbUrl(ref, w);

    const hit = cache.get(url);
    if (hit) return imageResponse(c, hit);
    const missedAt = misses.get(url);
    if (missedAt && Date.now() - missedAt < MISS_TTL_MS) return c.text('Not found', 404);

    let pending = inflight.get(url);
    if (!pending) {
      // Only real upstream fetches count against the visitor's budget.
      await deps.rateLimiter.hit('imageFetch', hashIp(clientIp(c), deps.config.ipHashSalt));
      pending = load(url).finally(() => inflight.delete(url));
      inflight.set(url, pending);
    }
    try {
      const image = await pending;
      cache.set(url, image);
      misses.delete(url);
      return imageResponse(c, image);
    } catch (error) {
      if (error instanceof UpstreamMissing) {
        if (misses.size > 5_000) misses.clear(); // bounded: forgetting old misses only costs a refetch
        misses.set(url, Date.now());
        return c.text('Not found', 404);
      }
      return c.text('Bad gateway', 502, { 'Cache-Control': 'no-store' });
    }
  });
};
