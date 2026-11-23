// Cross-sport rules (D07): bands S–D without caps; an unmapped fact is a typed error, never a guess.
import { describe, expect, it } from 'vitest';

import type { CrossSportItem } from './cross-sport-item.interface';
import type { CrossSportMapping } from './cross-sport-mapping.interface';
import { calculateCrossSportBands, groupByBand, unmappedCrossSportItems } from './cross-sport.helper';
import { UnmappedRecognitionError } from './unmapped-recognition.error';

const mappings: CrossSportMapping[] = [
  { sport: 'boxing', kind: 'recognition', value: 'undisputed', band: 'S' },
  { sport: 'boxing', kind: 'recognition', value: 'wbc', band: 'A' },
  { sport: 'football', kind: 'recognition', value: 'fifa-world-cup', band: 'S' },
  { sport: 'football', kind: 'recognition', value: 'uefa-euro', band: 'A' },
  { sport: 'bjj', kind: 'recognition', value: 'adcc', band: 'S' },
];
const item = (competitorId: string, sport: string, value: string, year: number, evidenceId = `${competitorId}-${value}`): CrossSportItem => ({
  competitorId,
  sport,
  kind: 'recognition',
  value,
  year,
  evidenceId,
});

describe('cross-sport bands', () => {
  it('maps each item and keeps the strongest band, summing the points without caps', () => {
    const entries = calculateCrossSportBands(
      [item('pele', 'football', 'fifa-world-cup', 1970), item('pele', 'football', 'uefa-euro', 1960), item('bjj', 'bjj', 'adcc', 2019)],
      mappings,
    );
    expect(entries[0]).toMatchObject({ competitorId: 'pele', band: 'S', points: 18 });
    expect(entries[1]).toMatchObject({ competitorId: 'bjj', band: 'S', points: 10 });
  });

  it('an unmapped competitive fact throws a typed error and appears in the review list', () => {
    const unknown = item('x', 'chess', 'world-champion', 1972);
    expect(() => calculateCrossSportBands([unknown], mappings)).toThrow(UnmappedRecognitionError);
    expect(unmappedCrossSportItems([unknown], mappings)).toEqual([unknown]);
  });

  it('period filters select the mapping of the era', () => {
    const era: CrossSportMapping[] = [
      { sport: 'boxing', kind: 'recognition', value: 'wba', band: 'A', toYear: 2000 },
      { sport: 'boxing', kind: 'recognition', value: 'wba', band: 'B', fromYear: 2001 },
    ];
    expect(calculateCrossSportBands([item('a', 'boxing', 'wba', 1999)], era)[0]!.band).toBe('A');
    expect(calculateCrossSportBands([item('b', 'boxing', 'wba', 2005)], era)[0]!.band).toBe('B');
  });

  it('groups the public list by band in S–D order', () => {
    const grouped = groupByBand(
      calculateCrossSportBands([item('a', 'football', 'fifa-world-cup', 1970), item('b', 'boxing', 'wbc', 1990), item('c', 'bjj', 'adcc', 2019)], mappings),
    );
    expect(grouped.S.map((e) => e.competitorId).sort()).toEqual(['a', 'c']);
    expect(grouped.A.map((e) => e.competitorId)).toEqual(['b']);
  });
});
