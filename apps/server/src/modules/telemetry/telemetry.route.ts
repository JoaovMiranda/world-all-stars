import { ParticipationApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { TelemetryController } from './telemetry.controller';

/** POST /api/vitals (RUM): one log line per metric, nothing stored. */
export const telemetryRoutes = [
  defineRoute(ParticipationApi.reportWebVitals, (input, ctx) => new TelemetryController(ctx).reportWebVitals(input), { rateLimit: 'vitals' }),
];
