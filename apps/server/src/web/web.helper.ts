import { LOCALE_COOKIE, type Locale, resolveLocale } from '@was/shared';
import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { CACHE_CONTROL } from '../consts/cache-control.const';
import type { HonoEnv } from '../http/app-context.type';
import type { CachedPage } from './cached-page.interface';
import { etagMatches } from './html-cache.helper';
import { SsrTimeoutError } from './ssr-timeout.error';
import { PAGE_VARY } from './web.const';

/** Locale of a page request: the same rule the renderer (boot) and the API apply (cookie → Accept-Language → pt-BR). */
export const pageLocale = (c: Context<HonoEnv>): Locale =>
  resolveLocale({ cookie: getCookie(c, LOCALE_COOKIE), acceptLanguage: c.req.header('accept-language') });
/** In-process cache key: one entry per language of each path + search. */
export const pageCacheKey = (locale: Locale, url: URL): string => `${locale}|${url.pathname}${url.search}`;
/** Rejects when the render has not produced its Response in time (the client gets a 503 instead of a hung socket). */
export const withTimeout = <T>(ms: number, work: Promise<T>): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new SsrTimeoutError()), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
};
export const isApi = (p: string) => p === '/api' || p.startsWith('/api/');

/** A shareable page (fresh render or cache hit): CDN-ready headers, 304 when the client already has these bytes. */
export const respond = (c: Context<HonoEnv>, page: Pick<CachedPage, 'status' | 'headers' | 'body' | 'etag'>, ifNoneMatch: string | undefined) => {
  const headers = new Headers(page.headers);
  headers.set('Cache-Control', CACHE_CONTROL.publicHtml);
  headers.set('ETag', page.etag);
  headers.set('Vary', PAGE_VARY);
  headers.set('Content-Language', c.get('locale'));
  if (etagMatches(ifNoneMatch, page.etag)) {
    headers.delete('content-type');
    return c.body(null, 304, Object.fromEntries(headers));
  }
  return new Response(page.body, { status: page.status, headers });
};
