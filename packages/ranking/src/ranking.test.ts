// Golden tests (handoff v3 §8.4, E05): hand-computed expectations; ranking-futebol.md §16 and ranking.md §9–§10.
import { describe, expect, it } from 'vitest';

import { runRanking } from './core/engine.helper';
import type { RankingEvidence } from './core/ranking-evidence.interface';
import type { RankingInput } from './core/ranking-input.interface';
import { basePoints } from './methodologies/bjj-career/bjj-career.helper';
import { bjjCareer, footballChampions } from './methodologies.const';

let seq = 0;
const m = (
  competitorId: string,
  competition: string,
  year: number,
  extra: Partial<Record<string, string | number | boolean | null>> = {},
): RankingEvidence => ({
  id: `m${++seq}`,
  version: 1,
  kind: 'squad_membership',
  competitorId,
  attributes: { competition, year, registration: 'registered', verification: 'verified', appeared: true, ...extra },
});
const people = (...ids: string[]) => ids.map((id) => ({ id, name: id, kind: 'person' as const }));

describe('football champions V1 (ranking-futebol §16)', () => {
  const input: RankingInput = {
    competitors: people('pele', 'cafu', 'messi', 'reserve', 'pending', 'rejected', 'disputed', 'marta', 'gold2'),
    evidence: [
      m('pele', 'fifa-world-cup', 1958),
      m('pele', 'fifa-world-cup', 1962, { appeared: true }),
      m('pele', 'fifa-world-cup', 1970),
      m('cafu', 'fifa-world-cup', 1994),
      m('cafu', 'fifa-world-cup', 2002),
      m('cafu', 'fifa-world-cup', 2002), // duplicate membership: one credit per edition
      m('messi', 'fifa-world-cup', 2022),
      m('messi', 'olympic-football', 2008),
      m('reserve', 'fifa-world-cup', 2002, { appeared: false }), // registered, never appeared: still a champion
      m('pending', 'fifa-world-cup', 2002, { verification: 'provisional' }),
      m('rejected', 'fifa-world-cup', 2002, { registration: 'rejected' }),
      m('disputed', 'fifa-world-cup', 2002, { verification: 'disputed' }),
      m('marta', 'fifa-womens-world-cup', 2007, { verification: 'provisional' }),
      m('gold2', 'olympic-football', 1952),
      m('gold2', 'olympic-football', 1964),
    ],
  };

  it('A: one credit per verified edition; duplicates, pending, rejected and disputed do not count', () => {
    const r = runRanking(footballChampions, 'world-cup-men', input);
    const by = Object.fromEntries(r.entries.map((e) => [e.competitorId, e]));
    expect(by.pele).toMatchObject({ rank: 1, score: 3 });
    expect(by.cafu).toMatchObject({ rank: 2, score: 2 });
    expect(by.reserve!.score).toBe(1);
    expect(by.pending!.eligible).toBe(false);
    expect(by.rejected!.eligible).toBe(false);
    expect(by.disputed!.eligible).toBe(false);
    // Messi (2022, appeared) ranks before the reserve (2002, did not appear): verified appearances break the tie.
    expect(by.messi!.rank).toBeLessThan(by.reserve!.rank!);
  });

  it('C: Olympic golds rank separately; B (women) is a separate classification', () => {
    const c = runRanking(footballChampions, 'olympic-men', input);
    expect(c.entries.find((e) => e.competitorId === 'gold2')).toMatchObject({ rank: 1, score: 2 });
    expect(c.entries.some((e) => e.competitorId === 'pele')).toBe(false);
    expect(runRanking(footballChampions, 'world-cup-women', input).entries.find((e) => e.competitorId === 'marta')?.eligible).toBe(false);
  });

  it('E: consolidated total, World Cup + Olympic combined (Messi = 2)', () => {
    const e = runRanking(footballChampions, 'overview', input);
    expect(e.entries.find((x) => x.competitorId === 'messi')).toMatchObject({ score: 2, metrics: { worldCups: 1, olympicGolds: 1 } });
  });

  it('ties share the position; the result is reproducible (same manifest ⇒ same output hash)', () => {
    const tie: RankingInput = { competitors: people('a', 'b'), evidence: [m('a', 'fifa-world-cup', 1990), m('b', 'fifa-world-cup', 1990)] };
    const r1 = runRanking(footballChampions, 'world-cup-men', tie);
    expect(r1.entries.map((e) => [e.rank, e.rankTied])).toEqual([
      [1, true],
      [1, true],
    ]);
    const r2 = runRanking(footballChampions, 'world-cup-men', { competitors: [...tie.competitors].reverse(), evidence: [...tie.evidence].reverse() });
    expect(r2.outputHash).toBe(r1.outputHash);
    expect(r2.inputHash).toBe(r1.inputHash);
  });
});

describe('BJJ career V1 (ranking.md §9–§10)', () => {
  const r = (competitorId: string, placement: number, tier: string, extra: Record<string, string | number | null> = {}): RankingEvidence => ({
    id: `r${++seq}`,
    version: 1,
    kind: 'result',
    competitorId,
    attributes: {
      placement,
      tier,
      belt: 'black',
      giMode: 'gi',
      gender: 'men',
      verification: 'verified',
      status: 'official',
      competition: 'ibjjf-world-championship',
      year: 2010,
      division: '-76 kg',
      ...extra,
    },
  });

  it('base points by interval × event multiplier (hand-computed examples)', () => {
    const cfg = bjjCareer.defaultConfig;
    expect([1, 2, 3, 4, 5, 8, 12, 17].map((p) => basePoints(p, cfg))).toEqual([100, 60, 35, 20, 10, 10, 5, 0]);
    const input: RankingInput = {
      competitors: people('roger', 'buchecha', 'pending', 'hof'),
      evidence: [
        r('roger', 1, 'world'),
        r('roger', 1, 'world'),
        r('roger', 2, 'continental'), // 1000 + 1000 + 360
        r('buchecha', 1, 'world'),
        r('buchecha', 1, 'national'), // 1000 + 400
        r('pending', 1, 'world', { verification: 'pending' }),
        {
          id: 'hof1',
          version: 1,
          kind: 'recognition',
          competitorId: 'hof',
          attributes: { recognition: 'hall_of_fame', giMode: 'gi', gender: 'men', belt: 'black' },
        },
      ],
    };
    const out = runRanking(bjjCareer, 'black-gi-men', input);
    expect(out.entries.find((e) => e.competitorId === 'roger')).toMatchObject({ rank: 1, score: 2360 });
    expect(out.entries.find((e) => e.competitorId === 'buchecha')).toMatchObject({ rank: 2, score: 1400 });
    expect(out.entries.find((e) => e.competitorId === 'pending')?.eligible).toBe(false);
    expect(out.entries.some((e) => e.competitorId === 'hof')).toBe(false); // Hall of Fame never scores
  });

  it('isolation: gi and no-gi, men and women are separate; football evidence is ignored', () => {
    const input: RankingInput = { competitors: people('x'), evidence: [r('x', 1, 'world', { giMode: 'no-gi' }), m('x', 'fifa-world-cup', 2002)] };
    expect(runRanking(bjjCareer, 'black-gi-men', input).entries).toHaveLength(0);
    expect(runRanking(bjjCareer, 'nogi-men', input).entries[0]).toMatchObject({ score: 1000 });
    expect(runRanking(footballChampions, 'overview', input).entries[0]).toMatchObject({ score: 1 });
  });
});
