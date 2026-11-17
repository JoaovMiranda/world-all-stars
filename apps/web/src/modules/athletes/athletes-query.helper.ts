import { type AthleteFilters, CommentSort } from '@was/shared';

// Inputs of the athletes queries, shared by the route loaders and the pages (same query keys → hydration matches).

/** Every athlete (filter options, compare picker). */
export const ALL_ATHLETES_INPUT = { query: {} } as const;
/** The filtered list of /athletes. */
export const athletesListInput = (filters: AthleteFilters) => ({ query: filters });
export const athleteProfileInput = (slug: string) => ({ params: { slug } });
export const commentsInput = (slug: string, sort: CommentSort | undefined) => ({ params: { slug }, query: { sort: sort ?? CommentSort.Top } });
