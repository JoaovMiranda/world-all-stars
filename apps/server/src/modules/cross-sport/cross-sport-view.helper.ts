import type { CrossSportRun } from '@was/ranking';
import {
  CROSS_SPORT_BAND_POINTS,
  CROSS_SPORT_BAND_VALUES,
  CROSS_SPORT_ERA_RANGES,
  CROSS_SPORT_PAGE_SIZE,
  type CrossSportEntryDto,
  type CrossSportFilters,
  type CrossSportItemDto,
  type CrossSportListResponse,
} from '@was/shared';

import type { PublishedFact } from './published-fact.interface';

/** Sport reference of a fact (slug + localized name). */
const sportOf = (fact: PublishedFact | undefined) => ({ slug: fact?.sport ?? 'unknown', name: fact?.sportName ?? fact?.sport ?? 'unknown' });

/** Public DTOs of a run: each entry with its labelled items, its sports and the count of facts waiting for review. */
export const crossSportEntriesOf = (run: CrossSportRun, facts: readonly PublishedFact[]): CrossSportEntryDto[] => {
  const byId = new Map(facts.map((f) => [f.evidenceId, f]));
  const pending = new Map<string, number>();
  for (const u of run.unmapped) pending.set(u.item.competitorId, (pending.get(u.item.competitorId) ?? 0) + 1);
  return run.entries.map((e) => {
    const items: CrossSportItemDto[] = e.items.map((i) => {
      const fact = byId.get(i.evidenceId);
      return { evidenceId: i.evidenceId, band: i.band, points: i.points, label: fact?.label ?? i.value, sport: sportOf(fact), year: i.year };
    });
    const first = byId.get(e.items[0]?.evidenceId ?? '');
    const sports = [...new Map(items.map((i) => [i.sport.slug, i.sport])).values()];
    return {
      competitor: { id: e.competitorId, name: first?.competitorName ?? e.competitorId, slug: first?.competitorSlug ?? e.competitorId },
      band: e.band,
      points: e.points,
      sports,
      items,
      pendingReview: pending.get(e.competitorId) ?? 0,
    };
  });
};

/** Filters of `/rankings/all-sports`: sport of any accepted item, athlete gender, era of any accepted item. */
export const filterCrossSportEntries = (
  entries: readonly CrossSportEntryDto[],
  filters: CrossSportFilters,
  genderOf: (competitorId: string) => string | null,
) => {
  const range = filters.era ? CROSS_SPORT_ERA_RANGES[filters.era] : null;
  const inEra = (year: number | null) => !range || (year !== null && (range.from === null || year >= range.from) && (range.to === null || year <= range.to));
  return entries.filter(
    (e) =>
      (!filters.sport || e.sports.some((s) => s.slug === filters.sport)) &&
      (!filters.gender || genderOf(e.competitor.id) === filters.gender) &&
      (!range || e.items.some((i) => inEra(i.year))),
  );
};

/** One page of the band list: every band S→D with its filtered total and the entries of this page. */
export const crossSportPage = (run: CrossSportRun, entries: readonly CrossSportEntryDto[], page: number): Omit<CrossSportListResponse, 'sports'> => {
  const slice = entries.slice((page - 1) * CROSS_SPORT_PAGE_SIZE, page * CROSS_SPORT_PAGE_SIZE);
  return {
    rulesetVersion: run.rulesetVersion,
    inputHash: run.inputHash,
    outputHash: run.outputHash,
    groups: CROSS_SPORT_BAND_VALUES.map((band) => ({
      band,
      points: CROSS_SPORT_BAND_POINTS[band],
      total: entries.filter((e) => e.band === band).length,
      entries: slice.filter((e) => e.band === band),
    })),
    total: entries.length,
    page,
    pageSize: CROSS_SPORT_PAGE_SIZE,
    unmappedTotal: run.unmapped.length,
  };
};
