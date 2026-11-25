import { CompareApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { CompareController } from './compare.controller';

/** Compare / head-to-head (D04). */
export const compareRoutes = [defineRoute(CompareApi.compare, (input, ctx) => new CompareController(ctx).compare(input))];
