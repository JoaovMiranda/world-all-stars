/** Input of the competition page query, shared by the route loader and the page (same key → hydration matches). */
export const competitionPageInput = (competition: string) => ({ params: { competition } });

/** Input of the edition page query, shared by the route loader and the page. */
export const editionPageInput = (competition: string, edition: string) => ({ params: { competition, edition } });
