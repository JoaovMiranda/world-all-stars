import type { AthleteFilters } from '../schemas/athlete-filters.schema';
import type { AthleteSummary } from '../schemas/athlete-summary.schema';
import { normalizeForSearch } from './text-normalize.helper';

/**
 * Applies the /athletes filters (doc 09). `names` = known name, full name and nicknames: the name search ignores
 * accents and case. Same rule for the server query builder tests and the web fixtures.
 */
export const matchesAthleteFilters = (athlete: AthleteSummary, filters: AthleteFilters, names: readonly string[] = [athlete.knownAs]): boolean => {
  const q = normalizeForSearch(filters.q);
  return (
    (!q || names.some((n) => normalizeForSearch(n).includes(q))) &&
    (!filters.sport || athlete.sport.slug === filters.sport) &&
    (!filters.tier || athlete.tier === filters.tier) &&
    (!filters.group || athlete.sport.groupSlug === filters.group) &&
    (!filters.country || athlete.nationalities.some((n) => n.iso2.toLowerCase() === filters.country?.toLowerCase()))
  );
};
