// Golden fixtures of the registered methodologies (T2.3): a tiny, hand-written input per methodology. `verifyGoldens`
// re-runs the methodology over it at publication time; the output hash must match the recorded one, otherwise the
// snapshot is not published automatically.
import type { RankingInput } from './core/ranking-input.interface';

export const GOLDEN_INPUTS: Readonly<Record<string, { rankingKey: string; input: RankingInput }>> = {
  'football-champions': {
    rankingKey: 'world-cup-men',
    input: {
      competitors: [{ id: 'a', name: 'A', kind: 'person' }],
      evidence: [
        { id: 'f1', version: 1, kind: 'squad_membership', competitorId: 'a', attributes: { competition: 'fifa-world-cup', year: 1970, registration: 'registered', verification: 'verified', appeared: true } },
      ],
    },
  },
  'bjj-career': {
    rankingKey: 'black-gi-men',
    input: {
      competitors: [{ id: 'a', name: 'A', kind: 'person' }],
      evidence: [
        {
          id: 'b1',
          version: 1,
          kind: 'result',
          competitorId: 'a',
          attributes: { placement: 1, tier: 'world', belt: 'black', giMode: 'gi', gender: 'men', verification: 'verified', status: 'official', competition: 'adcc', year: 2019, division: 'absolute' },
        },
      ],
    },
  },
  boxing: {
    rankingKey: 'open',
    input: {
      competitors: [{ id: 'a', name: 'A', kind: 'person' }],
      evidence: [{ id: 'x1', version: 1, kind: 'boxing_title', competitorId: 'a', attributes: { organization: 'wbc', division: 'heavyweight', year: 1990 } }],
    },
  },
  'olympic-medals': {
    rankingKey: 'overall',
    input: {
      competitors: [{ id: 'a', name: 'A', kind: 'person' }],
      evidence: [{ id: 'o1', version: 1, kind: 'olympic_medal', competitorId: 'a', attributes: { medal: 'gold', sport: 'swimming', year: 2008, noc: 'BRA', edition: 'swimming-2008', team: false } }],
    },
  },
  'chess-classical': {
    rankingKey: 'overall',
    input: {
      competitors: [{ id: 'a', name: 'A', kind: 'person' }],
      evidence: [
        { id: 'c1', version: 1, kind: 'chess_title', competitorId: 'a', attributes: { format: 'classical', year: 1972 } },
        { id: 'c2', version: 1, kind: 'chess_rating', competitorId: 'a', attributes: { format: 'classical', rating: 2780, year: 1972 } },
      ],
    },
  },
  ironman: {
    rankingKey: 'overall',
    input: {
      competitors: [{ id: 'a', name: 'A', kind: 'person' }],
      evidence: [{ id: 'i1', version: 1, kind: 'ironman_result', competitorId: 'a', attributes: { event: 'ironman-world-championship', placement: 1, year: 2010 } }],
    },
  },
};

/** Output hashes recorded from the first deterministic run of each fixture (updated only with a version bump). */
export const GOLDEN_HASHES: Readonly<Record<string, string>> = {
  'football-champions': '934b3896aa07c620bce0cfb2064ca15214ac121e33086137dd5fb3eaa79ab696',
  'bjj-career': 'c979b0174edf8d0c286f33605ef955adf06949a22362be33cae6704490e77ab2',
  boxing: 'ce5befdc2a36a891664ddfc77c7aeae837f51e9a08af118a7095e8fe1e923d09',
  'olympic-medals': '75dae18cc9d302f4ac076d21a6ccd3ca7702d263939f49cc2ff3b2afbcc977f6',
  'chess-classical': '8d617ebcf9a6c041b802a9722ad316db813d5a6453b3286741838e7879f6572f',
  ironman: 'a0f95c68749e43492c37870fff611050857dc2af54161f778de6b2c95865db78',
};
