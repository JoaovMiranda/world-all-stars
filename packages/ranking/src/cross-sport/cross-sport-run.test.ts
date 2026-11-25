// Cross-sport run over published facts (T2.6): competitive facts only, unmapped → typed review items, reproducible hashes.
import { describe, expect, it } from 'vitest';
import type { CrossSportMapping } from './cross-sport-mapping.interface';
import { crossSportCandidatesOf, crossSportItemOf, crossSportRulesetHashes, runCrossSport } from './cross-sport-run.helper';
import type { RecognitionFact } from './recognition-fact.interface';
import { UnmappedRecognitionError } from './unmapped-recognition.error';

const mappings: CrossSportMapping[] = [
  { sport: 'football', kind: 'recognition', value: 'fifa-world-cup', band: 'S' },
  { sport: 'football', kind: 'recognition', value: 'copa-america', band: 'A' },
  { sport: 'multi-sport', kind: 'result', value: 'olympic-gold', band: 'S' },
  { sport: 'multi-sport', kind: 'result', value: 'olympic-bronze', band: 'B' },
];
const fact = (evidenceId: string, competitorId: string, patch: Partial<RecognitionFact> = {}): RecognitionFact => ({
  evidenceId,
  version: 1,
  competitorId,
  sport: 'football',
  recognitionKind: 'championship_title',
  level: 'winner',
  competition: 'fifa-world-cup',
  olympic: false,
  competitionLevel: 'world',
  issuer: 'fifa',
  definition: 'fifa-world-cup--championship_title',
  year: 1970,
  ...patch,
});
const facts: RecognitionFact[] = [
  fact('g1', 'pele'),
  fact('g2', 'pele', { competition: 'copa-america', year: 1959 }),
  fact('g3', 'phelps', { sport: 'swimming', recognitionKind: 'medal', level: 'gold', competition: 'olympic-games-summer', olympic: true, year: 2008 }),
  fact('g4', 'phelps', { sport: 'swimming', recognitionKind: 'medal', level: 'bronze', competition: 'olympic-games-summer', olympic: true, year: 2004 }),
  fact('g5', 'pele', { recognitionKind: 'award', competition: null, definition: 'award--ballon-dor' }),
  fact('g6', 'federer', { sport: 'tennis', competition: 'wimbledon', year: 2003 }),
];

describe('cross-sport run', () => {
  it('maps Olympic medals of any sport through the multi-sport rows and skips legacy-only kinds', () => {
    expect(crossSportItemOf(facts[2]!)).toMatchObject({ sport: 'multi-sport', kind: 'result', value: 'olympic-gold' });
    expect(crossSportItemOf(facts[4]!)).toBeNull();
    expect(crossSportItemOf(fact('x', 'y', { recognitionKind: 'runner_up', level: 'runner_up' }))).toMatchObject({
      kind: 'result',
      value: 'fifa-world-cup:runner_up',
    });
  });

  it('a title falls back to its issuing organization when the competition has no row', () => {
    const belt = fact('b1', 'tyson', {
      sport: 'boxing',
      competition: 'wbc-heavyweight-title',
      issuer: 'wbc',
      definition: 'wbc-heavyweight-title--championship_title',
    });
    expect(crossSportCandidatesOf(belt).map((c) => c.value)).toEqual(['wbc-heavyweight-title', 'wbc', 'wbc-heavyweight-title--championship_title']);
    const run = runCrossSport([belt], [{ sport: 'boxing', kind: 'recognition', value: 'wbc', band: 'A' }]);
    expect(run.entries[0]).toMatchObject({ competitorId: 'tyson', band: 'A', points: 8 });
    expect(runCrossSport([belt], []).unmapped[0]!.item.value).toBe('wbc-heavyweight-title');
  });

  it('computes bands without caps and lists unmapped competitive facts as typed errors', () => {
    const run = runCrossSport(facts, mappings);
    expect(run.entries.map((e) => [e.competitorId, e.band, e.points])).toEqual([
      ['pele', 'S', 18],
      ['phelps', 'S', 15],
    ]);
    expect(run.unmapped).toHaveLength(1);
    expect(run.unmapped[0]).toBeInstanceOf(UnmappedRecognitionError);
    expect(run.unmapped[0]!.item).toMatchObject({ sport: 'tennis', value: 'wimbledon' });
    expect(run.entries.find((e) => e.competitorId === 'federer')).toBeUndefined();
  });

  it('is reproducible: same facts and mappings in any order give the same hashes', () => {
    const a = runCrossSport(facts, mappings);
    const b = runCrossSport([...facts].reverse(), [...mappings].reverse());
    expect(b.inputHash).toBe(a.inputHash);
    expect(b.outputHash).toBe(a.outputHash);
    expect(b.rulesetHashes).toEqual(a.rulesetHashes);
  });

  it('a mapping change of one sport changes only that sport ruleset hash and the output', () => {
    const before = crossSportRulesetHashes(mappings);
    const changed = mappings.map((m) => (m.value === 'copa-america' ? { ...m, band: 'B' as const } : m));
    const after = crossSportRulesetHashes(changed);
    expect(after['multi-sport']).toBe(before['multi-sport']);
    expect(after.football).not.toBe(before.football);
    expect(runCrossSport(facts, changed).outputHash).not.toBe(runCrossSport(facts, mappings).outputHash);
  });
});
