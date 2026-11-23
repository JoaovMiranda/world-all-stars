import type { Context } from 'hono';

import type { HonoEnv } from '../http/app-context.type';
import type { CachedImage } from './cached-image.type';
import { IMAGE_CACHE_CONTROL } from './image-proxy.const';

/** Image response with long cache, validator (304 on a matching If-None-Match) and no-script headers. */
export const imageResponse = (c: Context<HonoEnv>, image: CachedImage) => {
  const headers = {
    'Content-Type': image.type,
    'Cache-Control': IMAGE_CACHE_CONTROL,
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
