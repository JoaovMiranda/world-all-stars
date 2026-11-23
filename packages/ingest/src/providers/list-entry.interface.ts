/** One line of an athlete list: a name (or Wikipedia link) and its sport when known. */
export interface ListEntry {
  name: string;
  sport: string | null;
}
