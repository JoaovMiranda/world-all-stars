export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
/** Thumbnail URLs never change content in practice; a month in the browser/CDN, revalidated in the background. */
export const IMAGE_CACHE_CONTROL = 'public, max-age=2592000, stale-while-revalidate=604800';
export const MISS_TTL_MS = 10 * 60_000;
