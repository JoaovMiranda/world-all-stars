/** Country as selected by the ranking facts SQL (`json_build_object` of countries + its translation). */
export interface RankingCountryRow {
  code: string | null;
  iso2: string | null;
  iso3: string | null;
  ioc: string | null;
  name: string | null;
}
