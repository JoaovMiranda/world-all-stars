import { ParticipationApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';

/**
 * POST /api/vitals (RUM): one JSON log line per metric (`msg: web-vital`), so the log platform can chart p75 by page
 * and connection. Nothing is stored in the database and nothing identifies the visitor.
 */
export const telemetryRoutes = [
  defineRoute(
    ParticipationApi.reportWebVitals,
    ({ body }) => {
      const t = new Date().toISOString();
      for (const m of body.metrics) {
        console.log(JSON.stringify({ t, level: m.rating === 'poor' ? 'warn' : 'info', msg: 'web-vital', name: m.name, value: Math.round(m.value * 1000) / 1000, rating: m.rating, path: m.path, nav: m.navigationType ?? null, conn: m.connection ?? null }));
      }
      return { ok: true as const };
    },
    { rateLimit: 'vitals' },
  ),
];
