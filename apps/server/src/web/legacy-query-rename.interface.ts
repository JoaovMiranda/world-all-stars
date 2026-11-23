/** One query parameter of a page whose Portuguese key and/or values were renamed to English (D35). */
export interface LegacyQueryRename {
  /** Page path the parameter belongs to. */
  path: RegExp;
  /** Old key in the URL. */
  key: string;
  /** New key (absent: the key did not change). */
  to?: string;
  /** Old value → new value (values not listed are kept). */
  values: Readonly<Record<string, string>>;
}
