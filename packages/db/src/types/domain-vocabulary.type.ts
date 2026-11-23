/** Names of a domain value: [en, pt-BR, es]. */
export type DomainValueNames = readonly [en: string, pt: string, es: string];
/** One seeded domain value: slug, names and optional attributes. */
export type DomainVocabularyValue = readonly [slug: string, names: DomainValueNames, attributes: Record<string, unknown> | undefined];
