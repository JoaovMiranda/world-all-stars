/** A country a ranked competitor represents (or represented in one entry), as the filters see it. */
export interface RankingCountryFact {
  /** Filter value: the internal country code (`br`, `urs`). */
  value: string;
  /** NOC code (`BRA`), when known. */
  ioc: string | null;
  /** Every code that matches this country, lower-case (code, ISO alpha-2, alpha-3, IOC). */
  codes: string[];
  name: string;
}
