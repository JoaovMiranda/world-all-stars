/** Rows written by the universal backfill, by table name. */
export interface BackfillReport {
  [table: string]: number;
}
