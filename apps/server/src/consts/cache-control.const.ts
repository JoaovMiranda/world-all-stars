/**
 * `Cache-Control` values used by the server (D20). One place so HTML, assets, images and SEO files stay consistent.
 * - immutableAsset: content-hashed build assets.
 * - publicHtml: anonymous SSR pages (CDN `s-maxage` + in-process HtmlCache, purged on publish).
 * - privateHtml: pages rendered for a signed-in user; never stored by shared caches.
 * - noStore: errors and responses that must never be cached.
 * - image: proxied Wikimedia images (30 days, revalidate for a week).
 * - staticFile: unhashed public files (favicon, manifest).
 * - sitemap: robots.txt and sitemaps.
 */
export const CACHE_CONTROL = {
  immutableAsset: 'public, max-age=31536000, immutable',
  publicHtml: 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
  privateHtml: 'private, no-cache',
  noStore: 'no-store',
  image: 'public, max-age=2592000, stale-while-revalidate=604800',
  staticFile: 'public, max-age=3600',
  sitemap: 'public, max-age=3600',
} as const;
