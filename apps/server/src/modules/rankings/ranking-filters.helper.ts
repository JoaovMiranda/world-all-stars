import {
  BJJ_BELT_VALUES,
  GI_MODE_VALUES,
  OLYMPIC_SEASON_VALUES,
  RANKING_FILTER_KEYS_BY_METHODOLOGY,
  type RankingFilterFields,
  RankingFilterKey,
  type RankingFilterOption as FilterOption,
  type RankingFilterOptionsResponse,
  RankingSex,
} from '@was/shared';

import type { RankingCountryFact } from './ranking-country-fact.interface';
import type { RankingEntryFacts } from './ranking-entry-facts.interface';
import type { RankingItemFact } from './ranking-item-fact.interface';

const lower = (v: string | null | undefined) => (v ?? '').toLowerCase();
const PERSON_GENDER: Record<string, string> = { [RankingSex.Men]: 'male', [RankingSex.Women]: 'female' };
const SEX_OF_GENDER: Record<string, string> = { male: RankingSex.Men, female: RankingSex.Women };
const ABSOLUTE = /absolut|open/i;

const categoryValues = (item: RankingItemFact, dimension: string) => item.categories.filter((c) => c.dimension === dimension);
const hasCategory = (item: RankingItemFact, dimension: string, value: string) =>
  categoryValues(item, dimension).some((c) => lower(c.slug) === lower(value) || lower(c.label) === lower(value));
const isAbsolute = (item: RankingItemFact) => categoryValues(item, 'weight').some((c) => ABSOLUTE.test(c.slug) || ABSOLUTE.test(c.label));
const seasonOf = (item: RankingItemFact) => OLYMPIC_SEASON_VALUES.find((s) => lower(item.competition).includes(s)) ?? null;

/** Countries of the competitor and of every entry it was counted in (national team, NOC). */
const countriesOf = (facts: RankingEntryFacts): RankingCountryFact[] => [
  ...facts.countries,
  ...facts.items.map((i) => i.country).filter((c): c is RankingCountryFact => c !== null),
];
const matchesCountry = (facts: RankingEntryFacts, value: string) => countriesOf(facts).some((c) => c.codes.includes(lower(value)));

/** The filters of `query` that the methodology accepts (others are ignored, so a stale `?belt=` never empties a list). */
export const activeRankingFilters = (methodology: string, query: RankingFilterFields): RankingFilterFields => {
  const keys = RANKING_FILTER_KEYS_BY_METHODOLOGY[methodology] ?? [];
  return Object.fromEntries(keys.filter((k) => query[k] !== undefined).map((k) => [k, query[k]])) as RankingFilterFields;
};

/** One piece of evidence satisfies every evidence-level filter at once (same result: no-gi AND -77 kg AND ADCC). */
const itemMatches = (item: RankingItemFact, f: RankingFilterFields, gender: string | null): boolean =>
  (f.sex === undefined ||
    (categoryValues(item, 'sex_category').length ? hasCategory(item, 'sex_category', f.sex) : gender === PERSON_GENDER[f.sex])) &&
  (f.gi === undefined || hasCategory(item, 'gi_mode', f.gi)) &&
  (f.belt === undefined || hasCategory(item, 'belt', f.belt)) &&
  (f.weight === undefined || hasCategory(item, 'weight', f.weight)) &&
  (f.division === undefined || hasCategory(item, 'weight', f.division)) &&
  (f.absolute === undefined || isAbsolute(item) === f.absolute) &&
  (f.organization === undefined || lower(item.organization) === lower(f.organization) || lower(item.competition) === lower(f.organization)) &&
  (f.competition === undefined || lower(item.competition) === lower(f.competition)) &&
  (f.edition === undefined || item.edition === f.edition) &&
  (f.sport === undefined || lower(item.sport) === lower(f.sport)) &&
  (f.season === undefined || seasonOf(item) === f.season);

const ITEM_KEYS = ['sex', 'gi', 'belt', 'weight', 'division', 'absolute', 'organization', 'competition', 'edition', 'sport', 'season'] as const;

/** Whether one entry passes the (already methodology-scoped) filters. */
export const matchesRankingFilters = (facts: RankingEntryFacts, f: RankingFilterFields): boolean => {
  if (f.gender !== undefined && facts.gender !== PERSON_GENDER[f.gender]) return false;
  for (const country of [f.country, f.nationality, f.noc]) if (country !== undefined && !matchesCountry(facts, country)) return false;
  if (f.position !== undefined && ![...facts.positions, ...facts.items.map((i) => i.position)].some((p) => lower(p) === lower(f.position))) return false;
  if (!ITEM_KEYS.some((k) => f[k] !== undefined)) return true;
  return facts.items.some((item) => itemMatches(item, f, facts.gender));
};

/** Distinct options, sorted by label (or by the given comparator). */
const distinct = (options: FilterOption[], compare: (a: FilterOption, b: FilterOption) => number): FilterOption[] =>
  [...new Map(options.filter((o) => o.value && o.label).map((o) => [o.value, o])).values()].sort(compare);

/** Values of one filter present in the snapshot (only values the URL schema accepts). */
const optionsOf = (key: RankingFilterKey, all: RankingEntryFacts[], byLabel: (a: FilterOption, b: FilterOption) => number): FilterOption[] => {
  const items = all.flatMap((f) => f.items);
  const category = (dimension: string, allowed?: readonly string[]) =>
    distinct(
      items.flatMap((i) => categoryValues(i, dimension)).flatMap((c) => (!allowed || allowed.includes(c.slug) ? [{ value: c.slug, label: c.label || c.slug }] : [])),
      byLabel,
    );
  const countries = (value: (c: RankingCountryFact) => string) => distinct(all.flatMap(countriesOf).map((c) => ({ value: value(c), label: c.name })), byLabel);
  switch (key) {
    case RankingFilterKey.Sex: {
      const fromCategories = category('sex_category', [RankingSex.Men, RankingSex.Women]);
      return fromCategories.length ? fromCategories : optionsOf(RankingFilterKey.Gender, all, byLabel);
    }
    case RankingFilterKey.Gi:
      return category('gi_mode', GI_MODE_VALUES);
    case RankingFilterKey.Belt:
      return category('belt', BJJ_BELT_VALUES).sort((a, b) => BJJ_BELT_VALUES.indexOf(a.value as never) - BJJ_BELT_VALUES.indexOf(b.value as never));
    case RankingFilterKey.Weight:
    case RankingFilterKey.Division:
      return category('weight');
    case RankingFilterKey.Absolute:
      return items.some(isAbsolute)
        ? [
            { value: 'true', label: 'true' },
            { value: 'false', label: 'false' },
          ]
        : [];
    case RankingFilterKey.Gender:
      return distinct(
        all.flatMap((f) => (f.gender && SEX_OF_GENDER[f.gender] ? [{ value: SEX_OF_GENDER[f.gender]!, label: SEX_OF_GENDER[f.gender]! }] : [])),
        byLabel,
      );
    case RankingFilterKey.Country:
    case RankingFilterKey.Nationality:
      return countries((c) => c.value);
    case RankingFilterKey.Noc:
      return countries((c) => c.ioc ?? c.value.toUpperCase());
    case RankingFilterKey.Organization:
      return distinct(
        items.flatMap((i) => (i.organization ? [{ value: i.organization, label: i.organizationName ?? i.organization }] : [])),
        byLabel,
      );
    case RankingFilterKey.Competition:
      return distinct(
        items.flatMap((i) => (i.competition ? [{ value: i.competition, label: i.competitionName ?? i.competition }] : [])),
        byLabel,
      );
    case RankingFilterKey.Edition:
      return distinct(
        items.flatMap((i) => (i.edition !== null ? [{ value: String(i.edition), label: String(i.edition) }] : [])),
        (a, b) => Number(b.value) - Number(a.value),
      );
    case RankingFilterKey.Position:
      return distinct(
        [
          ...items.flatMap((i) => (i.position ? [{ value: i.position, label: i.positionName ?? i.position }] : [])),
          ...all.flatMap((f) => f.positions.map((p) => ({ value: p, label: p }))),
        ],
        byLabel,
      );
    case RankingFilterKey.Sport:
      return distinct(
        items.flatMap((i) => (i.sport ? [{ value: i.sport, label: i.sportName ?? i.sport }] : [])),
        byLabel,
      );
    case RankingFilterKey.Season:
      return distinct(
        items.flatMap((i) => {
          const season = seasonOf(i);
          return season ? [{ value: season, label: season }] : [];
        }),
        byLabel,
      );
  }
};

/**
 * Filters of a methodology with the values present in a snapshot. Enumerated keys (sex, gi, belt, gender, season,
 * absolute) carry their value as label: the page shows its own translated label.
 */
export const rankingFilterOptions = (methodology: string, facts: Iterable<RankingEntryFacts>, locale: string): RankingFilterOptionsResponse => {
  const all = [...facts];
  const collator = new Intl.Collator(locale);
  const byLabel = (a: FilterOption, b: FilterOption) => collator.compare(a.label, b.label);
  return {
    methodology,
    filters: (RANKING_FILTER_KEYS_BY_METHODOLOGY[methodology] ?? []).map((key) => ({ key, options: optionsOf(key, all, byLabel) })),
  };
};
