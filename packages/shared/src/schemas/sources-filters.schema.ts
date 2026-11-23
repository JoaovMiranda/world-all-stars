import { z } from 'zod';

import { SOURCE_USAGE_STATUS_VALUES } from '../enums/source-usage-status.enum';
import { optionalEnum } from './url-filter.schema';

/** URL filters of /sources (doc 09 P14): usage status of the source. */
export const SourcesFiltersSchema = z.object({
  status: optionalEnum(SOURCE_USAGE_STATUS_VALUES),
});
