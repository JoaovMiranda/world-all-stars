import type { HeadToHeadSearch } from '@was/shared';

// Input of the head-to-head query, shared by the route loader and the page (same query key → hydration matches).

/** Both slugs chosen and different: the comparison can be requested. */
export const isComparablePair = (search: HeadToHeadSearch): search is { a: string; b: string } => Boolean(search.a && search.b && search.a !== search.b);

/** GET /api/compare/head-to-head for a comparable pair. */
export const headToHeadInput = (pair: { a: string; b: string }) => ({ query: { a: pair.a, b: pair.b } });
