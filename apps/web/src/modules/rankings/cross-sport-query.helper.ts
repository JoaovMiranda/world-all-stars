import type { CrossSportFilters } from '@was/shared';

// Input of the cross-sport list query, shared by the route loader and the page (same query key → hydration matches).

/** GET /api/rankings/all-sports with the URL filters (keys with a value only). */
export const allSportsInput = (search: CrossSportFilters) => ({
  query: Object.fromEntries(Object.entries(search).filter(([, v]) => v !== undefined)) as CrossSportFilters,
});
