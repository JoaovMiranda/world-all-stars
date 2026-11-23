/** A row read from a legacy table by the universal backfill (soft-deleted rows filtered out). */
export type BackfillRow = Record<string, unknown> & { id: string };
