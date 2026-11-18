import { z } from 'zod';

import { TIER_VALUES } from '../enums/tier.enum';
import { DEFAULT_PAGE_SIZE } from '../consts/pagination.const';
import { optionalEnum, optionalPage, optionalText } from './url-filter.schema';

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

/**
 * Query of GET /api/athletes and search params of /athletes: the filters + `page` (1-based, DEFAULT_PAGE_SIZE items).
 * Without `page` the whole filtered list comes back (filter options, compare picker, sport pages).
 */
export const AthleteListQuerySchema = AthleteFiltersSchema.extend({ page: optionalPage() });
export type AthleteListQuery = z.infer<typeof AthleteListQuerySchema>;

/** One page of an already filtered and ordered list; `total` is the size of the whole list. */
export const pageOf = <T>(items: readonly T[], page: number | undefined, size: number = DEFAULT_PAGE_SIZE): { items: T[]; total: number } =>
  page ? { items: items.slice((page - 1) * size, page * size), total: items.length } : { items: [...items], total: items.length };

export const pageCountOf = (total: number, size: number = DEFAULT_PAGE_SIZE): number => Math.max(1, Math.ceil(total / size));
