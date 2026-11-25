// Fixture mode of the cross-sport bands (D07) and legacy levels (D11): built from the sample profiles with a demo
// subset of the mappings. Hashes are labelled as fixture values; the real ones come from the server run.
import {
  type AthleteBandResponse,
  type AthleteLegacyResponse,
  type AthleteProfile,
  CROSS_SPORT_BAND_POINTS,
  CROSS_SPORT_BAND_VALUES,
  CROSS_SPORT_ERA_RANGES,
  CROSS_SPORT_PAGE_SIZE,
  type CrossSportBand,
  type CrossSportEntryDto,
  type CrossSportFilters,
  type CrossSportItemDto,
  type CrossSportListResponse,
  type CrossSportMethodologyResponse,
  type CrossSportUnmappedResponse,
} from '@was/shared';

import { ApiError } from '../api-error.error';
import type { loadSample } from '../sample-fixtures.helper';
import {
  FIXTURE_L5_THRESHOLD,
  FIXTURE_LEGACY_POINTS,
  FIXTURE_LEGACY_THRESHOLDS,
  FIXTURE_OLYMPIC_BANDS,
  FIXTURE_TITLE_BANDS,
} from './cross-sport-fixture.const';

type Sample = typeof loadSample;
type Achievement = AthleteProfile['achievements'][number];

const RULESET = 'cross-sport@1';
const HASH = 'fixture';
/** Competition of a competition achievement, award of an award (the achievement union narrowed by its keys). */
const competitionOf = (a: Achievement) => ('competition' in a ? a.competition : null);
const awardOf = (a: Achievement) => ('award' in a ? a.award : null);
const order = (band: CrossSportBand) => CROSS_SPORT_BAND_VALUES.indexOf(band);

/** Band of a sample achievement, `undefined` when unmapped, `null` when not a competitive fact. */
const bandOf = (a: Achievement, sport: string): CrossSportBand | undefined | null => {
  const competition = competitionOf(a);
  if (!competition) return null;
  if ('isOlympic' in a && a.isOlympic) return FIXTURE_OLYMPIC_BANDS[a.type];
  return a.type === 'champion' || a.type === 'title_won' ? FIXTURE_TITLE_BANDS[sport]?.[competition.slug] : undefined;
};

const readout = (p: AthleteProfile) => {
  const items: CrossSportItemDto[] = [];
  const unmapped: Achievement[] = [];
  for (const a of p.achievements) {
    const band = bandOf(a, p.sport.slug);
    if (band === null) continue;
    if (band === undefined) unmapped.push(a);
    else
      items.push({
        evidenceId: a.id,
        band,
        points: CROSS_SPORT_BAND_POINTS[band],
        label: competitionOf(a)?.name ?? a.id,
        sport: { slug: p.sport.slug, name: p.sport.name },
        year: a.year,
      });
  }
  items.sort((a, b) => order(a.band) - order(b.band));
  return { items, unmapped };
};

const entriesOf = async (sample: Sample): Promise<{ entries: CrossSportEntryDto[]; unmapped: { p: AthleteProfile; a: Achievement }[] }> => {
  const profiles = Object.values(await sample('athlete-profiles.json'));
  const entries: CrossSportEntryDto[] = [];
  const unmapped: { p: AthleteProfile; a: Achievement }[] = [];
  for (const p of profiles) {
    const r = readout(p);
    unmapped.push(...r.unmapped.map((a) => ({ p, a })));
    if (!r.items.length) continue;
    entries.push({
      competitor: { id: p.id, name: p.knownAs, slug: p.slug },
      band: r.items[0]!.band,
      points: r.items.reduce((s, i) => s + i.points, 0),
      sports: [{ slug: p.sport.slug, name: p.sport.name }],
      items: r.items,
      pendingReview: r.unmapped.length,
    });
  }
  entries.sort((a, b) => order(a.band) - order(b.band) || b.points - a.points);
  return { entries, unmapped };
};

export const buildCrossSportList = async (sample: Sample, filters: CrossSportFilters = {}): Promise<CrossSportListResponse> => {
  const { entries, unmapped } = await entriesOf(sample);
  const range = filters.era ? CROSS_SPORT_ERA_RANGES[filters.era] : null;
  const inEra = (y: number | null) => !range || (y !== null && (range.from === null || y >= range.from) && (range.to === null || y <= range.to));
  const filtered = entries.filter((e) => (!filters.sport || e.sports.some((s) => s.slug === filters.sport)) && e.items.some((i) => inEra(i.year)));
  const page = filters.page ?? 1;
  const slice = filtered.slice((page - 1) * CROSS_SPORT_PAGE_SIZE, page * CROSS_SPORT_PAGE_SIZE);
  return {
    rulesetVersion: RULESET,
    inputHash: HASH,
    outputHash: HASH,
    groups: CROSS_SPORT_BAND_VALUES.map((band) => ({
      band,
      points: CROSS_SPORT_BAND_POINTS[band],
      total: filtered.filter((e) => e.band === band).length,
      entries: slice.filter((e) => e.band === band),
    })),
    total: filtered.length,
    page,
    pageSize: CROSS_SPORT_PAGE_SIZE,
    sports: [...new Map(entries.flatMap((e) => e.sports).map((s) => [s.slug, s])).values()],
    unmappedTotal: unmapped.length,
  };
};

export const buildCrossSportMethodology = async (sample: Sample): Promise<CrossSportMethodologyResponse> => {
  const { entries, unmapped } = await entriesOf(sample);
  const row = (value: string, band: CrossSportBand) => ({ kind: 'recognition', value, band, fromYear: null, toYear: null, sourceNote: 'handoff §11.4' });
  return {
    rulesetVersion: RULESET,
    inputHash: HASH,
    outputHash: HASH,
    bands: CROSS_SPORT_BAND_VALUES.map((band) => ({ band, points: CROSS_SPORT_BAND_POINTS[band] })),
    rulesets: [
      {
        sport: 'multi-sport',
        name: 'multi-sport',
        rulesetKey: `${RULESET}/multi-sport`,
        hash: HASH,
        mappings: Object.entries(FIXTURE_OLYMPIC_BANDS).map(([level, band]) => ({ ...row(`olympic-${level}`, band), kind: 'result' })),
      },
      ...Object.entries(FIXTURE_TITLE_BANDS).map(([sport, rows]) => ({
        sport,
        name: sport,
        rulesetKey: `${RULESET}/${sport}`,
        hash: HASH,
        mappings: Object.entries(rows).map(([value, band]) => row(value, band)),
      })),
    ],
    competitors: entries.length,
    unmappedTotal: unmapped.length,
  };
};

export const buildCrossSportUnmapped = async (sample: Sample): Promise<CrossSportUnmappedResponse> => {
  const { unmapped } = await entriesOf(sample);
  const items = unmapped.map(({ p, a }) => ({
    evidenceId: a.id,
    competitor: { id: p.id, name: p.knownAs, slug: p.slug },
    sport: p.sport.slug,
    kind: 'recognition' as const,
    value: competitionOf(a)?.slug ?? a.id,
    label: competitionOf(a)?.name ?? a.id,
    year: a.year,
    error: `No cross-sport mapping for ${p.sport.slug}/recognition/${competitionOf(a)?.slug ?? a.id} (evidence ${a.id})`,
  }));
  return { rulesetVersion: RULESET, total: items.length, items };
};

const profileOr404 = async (sample: Sample, slug: string) => {
  const p = (await sample('athlete-profiles.json'))[slug];
  if (!p) throw new ApiError(404, { error: 'not_found' });
  return p;
};

export const buildAthleteBand = async (sample: Sample, slug: string): Promise<AthleteBandResponse> => {
  const r = readout(await profileOr404(sample, slug));
  return {
    slug,
    rulesetVersion: RULESET,
    outputHash: HASH,
    band: r.items[0]?.band ?? null,
    points: r.items.reduce((s, i) => s + i.points, 0),
    items: r.items,
    pendingReview: r.unmapped.length,
  };
};

export const buildAthleteLegacy = async (sample: Sample, slug: string): Promise<AthleteLegacyResponse> => {
  const p = await profileOr404(sample, slug);
  const accepted: AthleteLegacyResponse['accepted'] = [];
  const excluded: AthleteLegacyResponse['excluded'] = [];
  for (const a of p.achievements) {
    const label = competitionOf(a)?.name ?? awardOf(a)?.name ?? a.id;
    const key = a.kind === 'award' ? 'award' : a.type === 'champion' || a.type === 'gold' || a.type === 'title_won' ? a.level : null;
    const points = key ? (FIXTURE_LEGACY_POINTS[key] ?? 0) : 0;
    if (points) accepted.push({ evidenceId: a.id, kind: key === 'award' ? 'award' : `${key}_champion`, label, points, year: a.year });
    else excluded.push({ evidenceId: a.id, label, reason: 'not a legacy honor' });
  }
  const score = accepted.reduce((s, h) => s + h.points, 0);
  const dossierStatus = p.dossier?.status ?? null;
  const computed = FIXTURE_LEGACY_THRESHOLDS.find(([, min]) => score >= min)?.[0] ?? 'L0';
  const level = dossierStatus === 'approved' && score >= FIXTURE_L5_THRESHOLD ? 'L5' : computed;
  accepted.sort((a, b) => b.points - a.points);
  return {
    slug,
    rulesetVersion: 'legacy@1',
    level,
    score,
    accepted,
    excluded,
    dossierStatus,
    l5Threshold: FIXTURE_L5_THRESHOLD,
    explanation: `Score ${score}`,
  };
};
