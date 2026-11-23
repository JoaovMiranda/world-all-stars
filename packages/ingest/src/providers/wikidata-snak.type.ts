/** One Wikidata statement as the profile provider reads it (main value + qualifiers). */
export type Snak = { mainsnak: { datavalue?: { value: unknown } }; qualifiers?: Record<string, { datavalue?: { value: unknown } }[]> };
