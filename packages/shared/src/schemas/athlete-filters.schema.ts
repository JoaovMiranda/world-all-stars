import { z } from 'zod';

import { TIER_VALUES } from '../enums/tier.enum';
import { optionalEnum, optionalText } from './url-filter.schema';

/** Filters of GET /api/athletes and URL search params of /athletes (doc 09: q, sport, country, tier). */
export const AthleteFiltersSchema = z.object({
  /** Name search: known name, full name and nicknames, no accents/case. */
  q: optionalText(),
  sport: optionalText(),
  /** ISO 3166-1 alpha-2 of any nationality. */
  country: optionalText(),
  tier: optionalEnum(TIER_VALUES),
  group: optionalText(),
});
export type AthleteFilters = z.infer<typeof AthleteFiltersSchema>;
