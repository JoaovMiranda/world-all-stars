import { z } from 'zod';

import { COMPETITION_LEVEL_VALUES } from '../enums/competition-level.enum';
import { TIER_VALUES } from '../enums/tier.enum';
import { optionalEnum, optionalText } from './url-filter.schema';

/** URL filters of /sports/$slug (doc 09 P7): search, country, athlete tier, competition level. */
export const SportPageFiltersSchema = z.object({
  q: optionalText(),
  country: optionalText(),
  tier: optionalEnum(TIER_VALUES),
  level: optionalEnum(COMPETITION_LEVEL_VALUES),
});
export type SportPageFilters = z.infer<typeof SportPageFiltersSchema>;
