/**
 * Rate limits per IP/user (doc 05). The server applies them per route; Cloudflare WAF is the first layer.
 * `windowMs` fixed window, `max` requests in the window.
 */
export const RATE_LIMITS = {
  read: { windowMs: 60_000, max: 120 },
  comment: { windowMs: 60_000, max: 5 },
  commentDaily: { windowMs: 86_400_000, max: 50 },
  reaction: { windowMs: 60_000, max: 60 },
  vote: { windowMs: 60_000, max: 30 },
  contact: { windowMs: 3_600_000, max: 5 },
  /** RUM beacons (POST /api/vitals): a few per page view. */
  vitals: { windowMs: 60_000, max: 30 },
  /** Image proxy (/img/wm): only thumbnails not yet cached count (each one is a fetch to Wikimedia). */
  imageFetch: { windowMs: 60_000, max: 120 },
} as const;
export type RateLimitKey = keyof typeof RATE_LIMITS;
