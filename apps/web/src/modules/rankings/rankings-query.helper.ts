import { canonicalQuery, RANKING_SORT_ONLY_PARAMS, type RankingDetailSearch, type RankingsListQuery } from '@was/shared';

import { RANKING_PAGE_SIZE } from './ranking-table.const';

// Inputs of the rankings queries, shared by the route loaders and the pages (same query keys → hydration matches).

/** Keys with a value only, so `{ gi: undefined }` and `{}` give the same query key and API query. */
const defined = <T extends Record<string, unknown>>(obj: T): Partial<T> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;

/** GET /api/rankings with the /rankings URL filters. */
export const rankingsListInput = (search: RankingsListQuery) => ({ query: defined(search) });

/** One page of /rankings/$id with its URL filters and sort (page 1 when the URL has none). */
export const rankingDetailInput = (id: string, search: RankingDetailSearch) => {
  const { page, ...rest } = search;
  return { params: { id }, query: { ...defined(rest), page: page ?? 1, pageSize: RANKING_PAGE_SIZE } };
};

export const rankingFilterOptionsInput = (id: string) => ({ params: { id } });

/** Canonical query of a ranking page: its filters and page, never the sort. */
export const rankingCanonicalSearch = (search: Readonly<Record<string, unknown>>) => canonicalQuery(search, RANKING_SORT_ONLY_PARAMS);
