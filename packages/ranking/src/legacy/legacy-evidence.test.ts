// Legacy over published facts (T2.7): L5 only with an approved dossier; legacy never alters cross-sport bands.
import { describe, expect, it } from 'vitest';

import type { CrossSportMapping } from '../cross-sport/cross-sport-mapping.interface';
import { runCrossSport } from '../cross-sport/cross-sport-run.helper';
import type { RecognitionFact } from '../cross-sport/recognition-fact.interface';
import { computeLegacyLevel } from './legacy.helper';
import { legacyEvidenceOf, legacyHonorOf } from './legacy-evidence.helper';

const title = (evidenceId: string, year: number, patch: Partial<RecognitionFact> = {}): RecognitionFact => ({
  evidenceId,
  version: 1,
  competitorId: 'x',
  sport: 'football',
  recognitionKind: 'championship_title',
  level: 'winner',
  competition: 'fifa-world-cup',
  olympic: false,
  competitionLevel: 'world',
  issuer: 'fifa',
  definition: 'fifa-world-cup--championship_title',
  year,
  ...patch,
});
const mappings: CrossSportMapping[] = [{ sport: 'football', kind: 'recognition', value: 'fifa-world-cup', band: 'S' }];
const nineTitles = [1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986, 1990].map((y) => title(`t${y}`, y));
const none = { career: null, dossierStatus: null, records: [] };

describe('legacy evidence', () => {
  it('reads titles by competition level, awards and halls of fame; silver medals are not legacy honors', () => {
    expect(legacyHonorOf(title('a', 1970))).toBe('world_champion');
    expect(legacyHonorOf(title('b', 1970, { competitionLevel: 'continental' }))).toBe('continental_champion');
    expect(legacyHonorOf(title('c', 1970, { recognitionKind: 'hall_of_fame' }))).toBe('hall_of_fame');
    expect(legacyHonorOf(title('d', 1970, { recognitionKind: 'ranking_honor' }))).toBe('award');
    expect(legacyHonorOf(title('e', 1970, { recognitionKind: 'medal', level: 'silver' }))).toBe('medal:silver');
  });

  it('L5 is impossible without an approved dossier, even above the threshold', () => {
    expect(computeLegacyLevel(legacyEvidenceOf(nineTitles, none)).level).toBe('L4');
    expect(computeLegacyLevel(legacyEvidenceOf(nineTitles, { ...none, dossierStatus: 'pending' })).level).toBe('L4');
    expect(computeLegacyLevel(legacyEvidenceOf(nineTitles, { ...none, dossierStatus: 'approved' })).level).toBe('L5');
  });

  it('adds longevity and ratified records only', () => {
    const r = computeLegacyLevel(
      legacyEvidenceOf([title('a', 1970)], {
        career: { fromYear: 1956, toYear: 1977 },
        dossierStatus: null,
        records: [
          { evidenceId: 'r1', year: 1970, ratified: true },
          { evidenceId: 'r2', year: 1971, ratified: false },
        ],
      }),
    );
    expect(r.score).toBe(10 + 5 + 10);
    expect(r.excluded.map((e) => e.evidenceId)).toEqual(['r2']);
  });

  it('legacy never alters the cross-sport band of the same facts', () => {
    const before = runCrossSport(nineTitles, mappings);
    const legacy = computeLegacyLevel(legacyEvidenceOf(nineTitles, { ...none, dossierStatus: 'approved' }));
    const after = runCrossSport(nineTitles, mappings);
    expect(legacy.level).toBe('L5');
    expect(after.outputHash).toBe(before.outputHash);
    expect(after.entries).toEqual(before.entries);
  });
});
