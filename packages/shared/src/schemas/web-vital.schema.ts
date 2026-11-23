import { z } from 'zod';

import { WEB_VITAL_NAMES } from '../consts/web-vital.const';

/**
 * One field measurement from a real visitor (RUM). Anonymous by construction: no user/session id, no query string,
 * no IP kept (the server logs the metric line only). `path` is the pathname of the page.
 */
export const WebVitalSchema = z.object({
  name: z.enum(WEB_VITAL_NAMES),
  /** ms (LCP, INP, FCP, TTFB) or unitless score (CLS). */
  value: z.number().nonnegative().max(600_000),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  path: z.string().startsWith('/').max(200),
  /** navigate | reload | back-forward | prerender… */
  navigationType: z.string().max(32).optional(),
  /** Effective connection type when the browser exposes it (4g, 3g…). */
  connection: z.string().max(16).optional(),
});

/** Body of POST /api/vitals: the metrics a page collected, sent once when it is hidden (sendBeacon). */
export const WebVitalsRequestSchema = z.object({ metrics: z.array(WebVitalSchema).min(1).max(10) });
