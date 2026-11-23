/** One legacy → universal mapping checked by `legacy-parity.cli.ts`. */
export interface LegacyParityCheck {
  /** "achievements → recognition_grants". */
  mapping: string;
  /** Legacy table (or table.column) the rows come from; checked for existence first. */
  legacyTable: string;
  legacyColumn?: string | undefined;
  /** Live legacy rows (a readable label each) and, among them, those without a universal counterpart. */
  run(): Promise<{ legacy: string[]; missing: string[] }>;
}
