/** Options of the olympic-medalists provider run. */
export interface OlympicOptions {
  /** Sport slug of the medals (e.g. "swimming"). */
  sport: string;
  /** Wikipedia title of the "List of Olympic medalists in …" page. */
  listTitle: string;
  /** Only this Games year. */
  year?: number | undefined;
}
