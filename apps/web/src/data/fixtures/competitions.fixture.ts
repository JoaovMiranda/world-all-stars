// Fixture mode of the competition and edition pages (T4.1): built from the sample profiles' competition
// achievements (one event per category, the champion squad from the profiles that won with a team). Lineups and
// per-event marks only exist in the real database.
import {
  type AthleteProfile,
  type CompetitionAchievement,
  type CompetitionPage,
  type CompetitorRef,
  type EditionEvent,
  type EditionPage,
  editionKeys,
  isCompetitionAchievement,
  medalTable,
  type SourceRef,
} from '@was/shared';

import { ApiError } from '../api-error.error';
import { FIXTURE_CONTENT_LOCALE } from '../data-layer.const';
import type { loadSample } from '../sample-fixtures.helper';

type Sample = typeof loadSample;
type Hit = { p: AthleteProfile; a: CompetitionAchievement };

const RANK_OF_TYPE: Record<string, number> = { champion: 1, title_won: 1, gold: 1, runner_up: 2, silver: 2, bronze: 3 };
const rankOf = (a: CompetitionAchievement) => a.rank ?? RANK_OF_TYPE[a.type] ?? null;
const FIXTURE_UPDATED_AT = '2026-11-01T00:00:00.000Z';

const hitsOf = async (sample: Sample, slug: string): Promise<Hit[]> => {
  const profiles = Object.values(await sample('athlete-profiles.json'));
  const hits = profiles.flatMap((p) =>
    p.achievements
      .filter(isCompetitionAchievement)
      .filter((a) => a.competition.slug === slug)
      .map((a) => ({ p, a })),
  );
  if (!hits.length) throw new ApiError(404, { error: 'not_found' });
  return hits;
};

const nationOf = (p: AthleteProfile) => {
  const n = p.nationalities[0];
  return n ? { code: n.iso2, name: n.name, flag: n.flag } : null;
};

/** The champion team when the athlete won with one, else the athlete. */
const competitorOf = ({ p, a }: Hit): CompetitorRef =>
  a.team ? { name: a.team, slug: null, kind: 'team', nation: nationOf(p) } : { name: p.knownAs, slug: p.slug, kind: 'person', nation: nationOf(p) };

const uniqueBy = <T>(items: readonly T[], key: (t: T) => string) => [...new Map(items.map((i) => [key(i), i])).values()];

const header = (hits: readonly Hit[]) => {
  const { p, a } = hits[0]!;
  return {
    slug: a.competition.slug,
    name: a.competition.name,
    sport: p.sport,
    organization: null,
    level: a.level,
    isOlympic: a.isOlympic,
    isMultiSport: false,
    wikidataQid: null,
  };
};

const editionsOf = (hits: readonly Hit[]) => {
  const years = [...new Set(hits.map((h) => h.a.year))].sort((x, y) => x - y);
  const keys = editionKeys(years.map((y) => ({ id: String(y), year: y, number: null })));
  return years.map((year) => ({ year, key: keys.get(String(year))!, hits: hits.filter((h) => h.a.year === year) }));
};

const sourcesOf = (hits: readonly Hit[]): SourceRef[] =>
  uniqueBy(
    hits.flatMap((h) => (h.a.source ? [h.a.source] : [])),
    (s) => s.url,
  );

export const buildCompetitionPage = async (sample: Sample, slug: string): Promise<CompetitionPage> => {
  const hits = await hitsOf(sample, slug);
  return {
    ...header(hits),
    contentLocale: FIXTURE_CONTENT_LOCALE,
    editions: editionsOf(hits)
      .map((e) => {
        const first = e.hits[0]!.a;
        return {
          key: e.key,
          year: e.year,
          label: first.edition.label,
          number: first.edition.number,
          startDate: null,
          endDate: first.date,
          host: first.edition.host ? { code: first.edition.host.iso2, name: first.edition.host.name, flag: first.edition.host.flag } : null,
          status: 'finished' as const,
          winners: uniqueBy(e.hits.filter((h) => rankOf(h.a) === 1).map(competitorOf), (c) => c.name),
        };
      })
      .reverse(),
    sources: sourcesOf(hits),
    updatedAt: FIXTURE_UPDATED_AT,
  };
};

export const buildEditionPage = async (sample: Sample, slug: string, key: string): Promise<EditionPage> => {
  const hits = await hitsOf(sample, slug);
  const editions = editionsOf(hits);
  const index = editions.findIndex((e) => e.key === key);
  const edition = editions[index];
  if (!edition) throw new ApiError(404, { error: 'not_found' });
  const first = edition.hits[0]!.a;
  const categories = [...new Set(edition.hits.map((h) => h.a.category ?? ''))];
  const events: EditionEvent[] = categories.map((category) => {
    const inEvent = edition.hits.filter((h) => (h.a.category ?? '') === category);
    const teams = uniqueBy(
      inEvent.filter((h) => h.a.team),
      (h) => h.a.team!,
    );
    return {
      id: `${edition.key}-${category || 'main'}`,
      label: category || header(hits).name,
      category: category || null,
      results: uniqueBy(
        inEvent.map((h) => ({ rank: rankOf(h.a), tied: false, status: rankOf(h.a) === 1 ? 'won' : 'finished', competitor: competitorOf(h), mark: null })),
        (r) => r.competitor.name,
      ).sort((x, y) => (x.rank ?? 99) - (y.rank ?? 99)),
      squads: teams.map((t) => ({
        competitor: competitorOf(t),
        members: inEvent
          .filter((h) => h.a.team === t.a.team)
          .map((h) => ({ name: h.p.knownAs, slug: h.p.slug, role: null, position: h.p.position ?? null, shirtNumber: null })),
      })),
      lineups: [],
    };
  });
  const ref = (e: (typeof editions)[number] | undefined) => (e ? { key: e.key, year: e.year, label: e.hits[0]!.a.edition.label } : null);
  return {
    contentLocale: FIXTURE_CONTENT_LOCALE,
    competition: header(hits),
    key: edition.key,
    year: edition.year,
    label: first.edition.label,
    number: first.edition.number,
    startDate: null,
    endDate: first.date,
    host: first.edition.host ? { code: first.edition.host.iso2, name: first.edition.host.name, flag: first.edition.host.flag } : null,
    hostCity: null,
    status: 'finished',
    previous: ref(editions[index - 1]),
    next: ref(editions[index + 1]),
    events,
    medalTable: medalTable(events),
    sources: sourcesOf(edition.hits),
    updatedAt: FIXTURE_UPDATED_AT,
  };
};
