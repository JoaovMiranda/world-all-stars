export interface Crumb {
  name: string;
  /** Site path; the last crumb (current page) may omit it. */
  path?: string;
}
