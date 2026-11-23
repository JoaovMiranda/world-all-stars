import { type AthleteListQuery, CommentSort } from '@was/shared';

// Inputs of the athletes queries, shared by the route loaders and the pages (same query keys → hydration matches).

/** One page of the filtered list of /athletes (page 1 when the URL has none, so SSR and client share the key). */
export const athletesListInput = (filters: AthleteListQuery) => ({ query: { ...filters, page: filters.page ?? 1 } });
export const athleteProfileInput = (slug: string) => ({ params: { slug } });
export const commentsInput = (slug: string, sort: CommentSort | undefined) => ({ params: { slug }, query: { sort: sort ?? CommentSort.Top } });

// Re-exported for the route loaders, which load this module with a dynamic import (app/router.tsx).
export { ALL_ATHLETES_INPUT } from './athletes-query.const';
