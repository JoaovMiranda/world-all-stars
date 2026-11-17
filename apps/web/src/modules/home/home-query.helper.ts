import type { HomeSearch, IsoDate } from '@was/shared';

/** Input of the home query, shared by the route loader and the page (same query key → hydration matches). */
export const homeQueryInput = (search: HomeSearch, today: IsoDate) => ({ query: { date: search.date ?? today } });
