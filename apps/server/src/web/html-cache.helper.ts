import { createHash } from 'node:crypto';

import { isPersonalCookieName, PERSONAL_QUERY_PARAMS, PRIVATE_PATH_PREFIXES } from '@was/shared';

import { CATALOG_TABLES } from '../modules/catalog/catalog.const';
import { PUBLIC_PARTICIPATION_TABLES } from './html-cache.const';

/**
 * Whether a committed write to `table` can change an anonymous page (→ drop the HTML cache). Account data (users,
 * notifications, consents, sessions) and the inboxes (contact, suggestions, privacy) never render there; a renamed
 * author shows up when the page expires (SSR_CACHE_TTL_SECONDS).
 */
export const affectsPublicPages = (table: string): boolean => CATALOG_TABLES.has(table) || PUBLIC_PARTICIPATION_TABLES.has(table);

const cookieNames = (header: string | undefined): string[] =>
  (header ?? '')
    .split(';')
    .map((p) => p.split('=')[0]?.trim() ?? '')
    .filter(Boolean);

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
