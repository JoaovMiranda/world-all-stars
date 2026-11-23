// Hash golden check for the methodologies → BaseMethodology refactor (T0.7): the values below were recorded with the
// pre-refactor object-literal methodologies; class methodologies (direct engine call or through the type-erased
// registry) must reproduce them exactly.
import { describe, expect, it } from 'vitest';

import { runRanking } from './core/engine.helper';
import type { RankingInput } from './core/ranking-input.interface';
import { bjjCareer, footballChampions } from './methodologies.const';
import { METHODOLOGIES } from './registry.const';

const membership = (id: string, competitorId: string, year: number) => ({
  id,
  version: 1,
  kind: 'squad_membership',
  competitorId,
  attributes: { competition: 'fifa-world-cup', year, registration: 'registered', verification: 'verified', appeared: true },
});
const football: RankingInput = {
  competitors: [
    { id: 'pele', name: 'Pele', kind: 'person' },
    { id: 'cafu', name: 'Cafu', kind: 'person' },
  ],
  evidence: [membership('m1', 'pele', 1958), membership('m2', 'pele', 1962), membership('m3', 'cafu', 2002)],
};
const bjj: RankingInput = {
  competitors: [{ id: 'roger', name: 'Roger', kind: 'person' }],
  evidence: [
    {
      id: 'r1',
      version: 1,
      kind: 'result',
      competitorId: 'roger',
      attributes: {
        placement: 1,
        tier: 'world',
        belt: 'black',
        giMode: 'gi',
        gender: 'men',
        verification: 'verified',
        status: 'official',
        competition: 'x',
        year: 2010,
        division: 'd',
      },
    },
  ],
};

const FOOTBALL_WORLD_CUP_MEN = {
  methodologyVersion: '1.1.0',
  configHash: '31cbcc8a0d22eb7ea7fcf83b0c2436d2c0ad3a77a57fd77b39e93a4967bf6fdc',
  inputHash: '6afb14b9eb349789af99d527a5c4ac56ac9ae55f1c90848cd792b33d3c106281',
  outputHash: '35137667df7a9eec02b93de669d4bb69c4f4f07334c06e9be05e8fdec52556ab',
};
const BJJ_BLACK_GI_MEN = {
  methodologyVersion: '1.0.0',
  configHash: 'fe0a5e91431f0d1cd4b8e6a99ed90c77a2d7de07dd659bfc2a559932eb850eac',
  inputHash: '8a7cd1b0b7775d59eff91d9b658f73dc29fe79b1bdf054b1f93f1b6a96de6a91',
  outputHash: 'f984468d0cf11a5dfa8a04ba63321e8aab191f41241cda9a23ddea66fae0569b',
};

describe('methodology hashes are unchanged by the BaseMethodology refactor', () => {
  it('football-champions world-cup-men', () => {
    expect(runRanking(footballChampions, 'world-cup-men', football)).toMatchObject(FOOTBALL_WORLD_CUP_MEN);
    expect(METHODOLOGIES['football-champions']?.calculate('world-cup-men', football)).toMatchObject(FOOTBALL_WORLD_CUP_MEN);
  });

  it('bjj-career black-gi-men', () => {
    expect(runRanking(bjjCareer, 'black-gi-men', bjj)).toMatchObject(BJJ_BLACK_GI_MEN);
    expect(METHODOLOGIES['bjj-career']?.calculate('black-gi-men', bjj)).toMatchObject(BJJ_BLACK_GI_MEN);
  });
});
