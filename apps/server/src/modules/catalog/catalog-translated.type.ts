/** A row of a translation table: a locale plus its text columns. */
export type Translated = { locale: string } & Record<string, unknown>;
