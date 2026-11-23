/** One data cell of a wikitable, with its column header, the row's year and the current heading. */
export interface TableCell {
  year: number | null;
  column: string;
  heading: string;
  /** Every heading above the cell, outermost first (gender often lives in a parent heading). */
  path: string[];
  raw: string;
}
