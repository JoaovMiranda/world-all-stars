/** Hashed /assets/* files: their name changes with their content, so they are cached for a year. */
export const IMMUTABLE = 'public, max-age=31536000, immutable';
// HTML caching (docs 05/12): anonymous pages are public (CDN s-maxage + in-process LRU in production, dropped on any
// write); pages with app cookies, ?as=/?fixture=, account/admin and non-200 are `private, no-cache`.
// Language (doc 12 i18n): same URL, so pages vary by the `was_locale` cookie and Accept-Language. The locale is a
// cacheable variant (not personal): it is part of the in-process cache key and of `Vary`, never makes a page private.
export const PAGE_VARY = 'Cookie, Accept-Language';
