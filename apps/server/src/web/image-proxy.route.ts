import { createHash } from 'node:crypto';

import { commonsFileRef, commonsThumbUrl, IMAGE_PROXY_PREFIX, isWikimediaStep } from '@was/shared';
import type { Hono } from 'hono';
import type { HonoEnv } from '../http/app-context.type';
import type { AppDeps } from '../http/app-deps.interface';
import { clientIp, hashIp } from '../middlewares/session.middleware';
import type { CachedImage } from './cached-image.type';
import { ImageLru } from './image-lru.cache';
import { MAX_IMAGE_BYTES, MISS_TTL_MS } from './image-proxy.const';
import { imageResponse } from './image-proxy.helper';
import type { ImageProxyOptions } from './image-proxy-options.interface';
import { UpstreamMissing } from './upstream-missing.error';

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
