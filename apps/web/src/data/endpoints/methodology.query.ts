import { MethodologyApi } from '@was/shared';

import { defineQuery } from '../define-endpoint.helper';
import { buildMethodologyDoc } from '../fixtures/methodology.fixture';

/** GET /api/ranking-methodologies/:key: a methodology's METHODOLOGY.md as sanitized blocks (T4.2). */
export const methodologyDocQuery = defineQuery(MethodologyApi.doc, {
  sample: ({ input }) => buildMethodologyDoc(input.params.key),
  empty: 'not-found',
});
