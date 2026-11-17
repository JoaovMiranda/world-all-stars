/** Input of the sport page query, shared by the route loader and the page (same key → hydration matches). */
export const sportPageInput = (slug: string) => ({ params: { slug } });
