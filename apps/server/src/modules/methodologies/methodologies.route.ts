import { MethodologyApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { MethodologiesController } from './methodologies.controller';

/** T4.2: public methodology documents (METHODOLOGY.md parsed into sanitized blocks). */
export const methodologiesRoutes = [defineRoute(MethodologyApi.doc, (input, ctx) => new MethodologiesController(ctx).doc(input))];
