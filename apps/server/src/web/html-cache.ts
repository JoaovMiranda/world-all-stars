import { createHash } from 'node:crypto';

import { PERSONAL_QUERY_PARAMS, PRIVATE_PATH_PREFIXES, isPersonalCookieName } from '@was/shared';

import { CATALOG_TABLES } from '../modules/catalog/catalog.repository';

/** Shared caches (CDN) may keep an anonymous page 5 min and serve it stale for a day while revalidating. */
export const PUBLIC_HTML_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400';
/** Personalized or non-200 HTML: the browser revalidates, shared caches never store it. */
export const PRIVATE_HTML_CACHE_CONTROL = 'private, no-cache';

/** Reader content shown on anonymous pages besides the catalog: threads and reactions, tier-vote shares. */
const PUBLIC_PARTICIPATION_TABLES = new Set(['comments', 'comment_reactions', 'tier_votes']);
/**
 * Whether a committed write to `table` can change an anonymous page (→ drop the HTML cache). Account data (users,
 * notifications, consents, sessions) and the inboxes (contact, suggestions, privacy) never render there; a renamed
 * author shows up when the page expires (SSR_CACHE_TTL_SECONDS).
 */
export const affectsPublicPages = (table: string): boolean => CATALOG_TABLES.has(table) || PUBLIC_PARTICIPATION_TABLES.has(table);

const cookieNames = (header: string | undefined): string[] => (header ?? '').split(';').map((p) => p.split('=')[0]?.trim() ?? '').filter(Boolean);

/**
 * A page request is shareable when nothing personalizes it: no app cookie (session, fixture mode, theme) nor Better
 * Auth cookie (`was.session_token`…: signed in), no
 * `?as=`/`?fixture=`, not an account/admin page. Anything else renders per user.
 */
export const isShareablePageRequest = (url: URL, cookieHeader: string | undefined): boolean =>
  !PRIVATE_PATH_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`)) &&
  !PERSONAL_QUERY_PARAMS.some((p) => url.searchParams.has(p)) &&
  !cookieNames(cookieHeader).some(isPersonalCookieName);

/** Weak validator of the exact bytes (they include the CSP nonce, so a 304 never pairs a body with another nonce). */
export const htmlEtag = (body: string): string => `W/"${createHash('sha1').update(body).digest('base64url')}"`;

/** `If-None-Match` matches (list or `*`, weak comparison). */
export const etagMatches = (ifNoneMatch: string | undefined, etag: string): boolean =>
  !!ifNoneMatch && (ifNoneMatch.trim() === '*' || ifNoneMatch.split(',').some((t) => t.trim().replace(/^W\//, '') === etag.replace(/^W\//, '')));

export interface CachedPage {
  status: number;
  headers: [string, string][];
  body: string;
  etag: string;
  /** The CSP nonce baked into `body`: the response header must carry the same one. */
  nonce: string;
  expiresAt: number;
}

/**
 * In-process LRU of anonymous pages (production only). Entries live `ttlMs` and the whole cache is dropped on any
 * database write (BaseRepository onWrite), so a page never outlives the data it shows for more than the TTL of a
 * write-free period. Keyed by locale + path + search (pageCacheKey: the same URL renders in pt-BR, en or es).
 */
export class HtmlCache {
  private readonly entries = new Map<string, CachedPage>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 300,
  ) {}

  get enabled(): boolean {
    return this.ttlMs > 0;
  }

  get(key: string, now = Date.now()): CachedPage | undefined {
    const hit = this.entries.get(key);
    if (!hit) return undefined;
    this.entries.delete(key);
    if (hit.expiresAt <= now) return undefined;
    this.entries.set(key, hit); // most recently used last
    return hit;
  }

  set(key: string, page: Omit<CachedPage, 'expiresAt'>, now = Date.now()): void {
    if (!this.enabled) return;
    this.entries.delete(key);
    this.entries.set(key, { ...page, expiresAt: now + this.ttlMs });
    while (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value as string);
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}
