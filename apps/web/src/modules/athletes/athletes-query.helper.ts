import { type AthleteListQuery, CommentSort } from '@was/shared';

// Inputs of the athletes queries, shared by the route loaders and the pages (same query keys → hydration matches).

/** Every athlete (filter options, compare picker). */
export const ALL_ATHLETES_INPUT = { query: {} } as const;
/** One page of the filtered list of /athletes (page 1 when the URL has none, so SSR and client share the key). */
export const athletesListInput = (filters: AthleteListQuery) => ({ query: { ...filters, page: filters.page ?? 1 } });
export const athleteProfileInput = (slug: string) => ({ params: { slug } });
export const commentsInput = (slug: string, sort: CommentSort | undefined) => ({ params: { slug }, query: { sort: sort ?? CommentSort.Top } });
