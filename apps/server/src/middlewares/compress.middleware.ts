import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import zlib from 'node:zlib';

import { HTTP_HEADER } from '@was/shared';
import type { MiddlewareHandler } from 'hono';

import type { HonoEnv } from '../http/app-context.type';
import { COMPRESSIBLE, MIN_BYTES } from './compress.const';
import { pickEncoding } from './compress.helper';

/**
 * Brotli/gzip for dynamic responses (SSR pages, API JSON, robots/sitemap). Each chunk is flushed, so streamed SSR
 * still reaches the browser progressively. Brotli quality 5 / gzip 6: good ratio at a CPU cost fit for per-request
 * work. Hashed /assets are served precompressed (.br/.gz from the web build) by serveStatic, not here. In-process
 * API calls made by the renderer (x-was-ssr) are never compressed: nothing travels over the network.
 */
export const compress = (): MiddlewareHandler<HonoEnv> => async (c, next) => {
  await next();
  const res = c.res;
  if (c.req.method === 'HEAD' || c.req.header(HTTP_HEADER.ssr) || !res.body) return;
  if (res.status === 204 || res.status === 304 || res.headers.has('content-encoding')) return;
  if (res.headers.get('cache-control')?.includes('no-transform')) return;
  if (!COMPRESSIBLE.test(res.headers.get('content-type') ?? '')) return;
  const length = res.headers.get('content-length');
  if (length !== null && Number(length) < MIN_BYTES) return;
  const encoding = pickEncoding(c.req.header('accept-encoding'));
  if (!encoding) {
    res.headers.append('Vary', 'Accept-Encoding');
    return;
  }

  const zip =
    encoding === 'br'
      ? zlib.createBrotliCompress({
          flush: zlib.constants.BROTLI_OPERATION_FLUSH,
          params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5, [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT },
        })
      : zlib.createGzip({ level: 6, flush: zlib.constants.Z_SYNC_FLUSH });
  pipeline(Readable.fromWeb(res.body as import('node:stream/web').ReadableStream<Uint8Array>), zip).catch(() => {
    // Client went away or the source errored mid-stream: the response is already cut off, nothing else to do.
  });

  // Hono copies the previous response's headers onto the one assigned to c.res: adjust them after the assignment.
  c.res = new Response(Readable.toWeb(zip) as ReadableStream, res);
  const headers = c.res.headers;
  headers.delete('content-length');
  headers.set('content-encoding', encoding);
  headers.append('Vary', 'Accept-Encoding');
  // A weak validator stays valid across encodings; a strong one would now describe other bytes.
  const etag = headers.get('etag');
  if (etag && !etag.startsWith('W/')) headers.set('etag', `W/${etag}`);
};
