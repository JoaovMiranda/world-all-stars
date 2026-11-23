import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { BaseMethodology } from './base.methodology';
import type { ComputedEntry } from './computed-entry.interface';
import type { RankingDefinition } from './ranking-definition.interface';
import type { RankingInput } from './ranking-input.interface';
import type { RegisteredMethodology } from './registered-methodology.interface';

const ConfigSchema = z.object({ pointsPerTitle: z.number().default(10), minTitles: z.number().int().default(1) });
type Config = z.infer<typeof ConfigSchema>;

class TitlesMethodology extends BaseMethodology<Config> {
  readonly key = 'titles-probe';
  readonly version = '1.0.0';
  readonly sport = 'probe';
  readonly outputKind = 'score' as const;
  readonly configSchema = ConfigSchema;

  rankings(config: Config): RankingDefinition[] {
    return [{ key: 'all', title: `All (min ${config.minTitles})`, scope: {} }];
  }

  compute(_ranking: RankingDefinition, input: RankingInput, config: Config): ComputedEntry[] {
    return input.competitors.map((c) => {
      const titles = input.evidence.filter((e) => e.competitorId === c.id).length;
      const score = titles * config.pointsPerTitle;
      return {
        competitorId: c.id,
        eligible: titles >= config.minTitles,
        eligibilityReason: titles >= config.minTitles ? null : 'no titles',
        score,
        band: null,
        metrics: { titles },
        items: [],
        sortKey: [score],
      };
    });
  }
}

const input: RankingInput = {
  competitors: [
    { id: 'a', name: 'A', kind: 'person' },
    { id: 'b', name: 'B', kind: 'person' },
    { id: 'c', name: 'C', kind: 'person' },
  ],
  evidence: [
    { id: 'e1', version: 1, kind: 'title', competitorId: 'a', attributes: {} },
    { id: 'e2', version: 1, kind: 'title', competitorId: 'a', attributes: {} },
    { id: 'e3', version: 1, kind: 'title', competitorId: 'b', attributes: {} },
  ],
};

describe('BaseMethodology', () => {
  const methodology = new TitlesMethodology();

  it('derives the default config from the schema', () => {
    expect(methodology.defaultConfig).toEqual({ pointsPerTitle: 10, minTitles: 1 });
    expect(methodology.rankingDefinitions({ minTitles: 2 })).toEqual([{ key: 'all', title: 'All (min 2)', scope: {} }]);
  });

  it('calculates through the engine, reproducibly, behind the registry view', () => {
    const registered: RegisteredMethodology = methodology;
    const r1 = registered.calculate('all', input);
    const r2 = registered.calculate('all', input);
    expect(r1.entries.map((e) => [e.competitorId, e.rank, e.score])).toEqual([
      ['a', 1, 20],
      ['b', 2, 10],
      ['c', null, 0],
    ]);
    expect(r1.methodology).toBe('titles-probe');
    expect(r1.outputHash).toBe(r2.outputHash);
    expect(registered.calculate('all', input, { pointsPerTitle: 1 }).configHash).not.toBe(r1.configHash);
  });

  it('rejects an invalid config and an unknown ranking', () => {
    expect(() => methodology.calculate('all', input, { pointsPerTitle: 'x' })).toThrow();
    expect(() => methodology.calculate('nope', input)).toThrow('titles-probe has no ranking nope');
  });
});
