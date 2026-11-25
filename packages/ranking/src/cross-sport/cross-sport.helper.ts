import { CROSS_SPORT_BAND_ORDER, CROSS_SPORT_BANDS } from './cross-sport.const';
import type { CrossSportBand } from './cross-sport-band.type';
import type { CrossSportEntry, CrossSportItem } from './cross-sport-item.interface';
import type { CrossSportMapping } from './cross-sport-mapping.interface';
import { UnmappedRecognitionError } from './unmapped-recognition.error';

/** Most specific mapping wins: sport + kind + value, then the optional period filter. */
export const findCrossSportMapping = (item: CrossSportItem, mappings: readonly CrossSportMapping[]): CrossSportMapping | undefined =>
  mappings.find(
    (m) =>
      m.sport === item.sport &&
      m.kind === item.kind &&
      m.value === item.value &&
      (m.fromYear == null || m.fromYear === 0 || item.year == null || item.year >= m.fromYear) &&
      (m.toYear == null || item.year == null || item.year <= m.toYear),
  );

/** Items without a mapping — the admin review list. */
export const unmappedCrossSportItems = (items: readonly CrossSportItem[], mappings: readonly CrossSportMapping[]): CrossSportItem[] =>
  items.filter((item) => !findCrossSportMapping(item, mappings));

/**
 * Bands of every competitor: each mapped item contributes its band points (no caps) and the competitor's band is the
 * strongest band it reached. Unmapped items throw a typed error instead of being guessed.
 */
export const calculateCrossSportBands = (items: readonly CrossSportItem[], mappings: readonly CrossSportMapping[]): CrossSportEntry[] => {
  const byCompetitor = new Map<string, CrossSportEntry>();
  for (const item of items) {
    const mapping = findCrossSportMapping(item, mappings);
    if (!mapping) throw new UnmappedRecognitionError(item);
    const points = CROSS_SPORT_BANDS[mapping.band];
    const entry = byCompetitor.get(item.competitorId) ?? { competitorId: item.competitorId, band: mapping.band, points: 0, items: [] };
    entry.points += points;
    entry.items.push({ evidenceId: item.evidenceId, band: mapping.band, points, value: item.value, year: item.year });
    if (CROSS_SPORT_BAND_ORDER.indexOf(mapping.band) < CROSS_SPORT_BAND_ORDER.indexOf(entry.band)) entry.band = mapping.band;
    byCompetitor.set(item.competitorId, entry);
  }
  for (const entry of byCompetitor.values()) entry.items.sort((a, b) => CROSS_SPORT_BAND_ORDER.indexOf(a.band) - CROSS_SPORT_BAND_ORDER.indexOf(b.band));
  return [...byCompetitor.values()].sort(
    (a, b) =>
      CROSS_SPORT_BAND_ORDER.indexOf(a.band) - CROSS_SPORT_BAND_ORDER.indexOf(b.band) || b.points - a.points || a.competitorId.localeCompare(b.competitorId),
  );
};

/** Groups a band list by band (the public `/rankings/all-sports` layout). */
export const groupByBand = (entries: readonly CrossSportEntry[]): Record<CrossSportBand, CrossSportEntry[]> =>
  Object.fromEntries(CROSS_SPORT_BAND_ORDER.map((band) => [band, entries.filter((e) => e.band === band)])) as Record<CrossSportBand, CrossSportEntry[]>;
