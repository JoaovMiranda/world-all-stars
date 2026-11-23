/** Athletes already on the site, to refuse duplicates (known name or full name, no accents/case). */
export type KnownAthlete = { slug: string; knownAs: string; fullName: string | null };
