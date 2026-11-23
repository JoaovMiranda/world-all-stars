/** ISO 8601 string of a timestamp column, null when unset. */
export const isoOf = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);
