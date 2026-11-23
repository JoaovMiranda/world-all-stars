/** Shared caches (CDN) may keep an anonymous page 5 min and serve it stale for a day while revalidating. */
export const PUBLIC_HTML_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400';
/** Personalized or non-200 HTML: the browser revalidates, shared caches never store it. */
export const PRIVATE_HTML_CACHE_CONTROL = 'private, no-cache';

/** Reader content shown on anonymous pages besides the catalog: threads and reactions, tier-vote shares. */
export const PUBLIC_PARTICIPATION_TABLES = new Set(['comments', 'comment_reactions', 'tier_votes']);
