// Jiu-Jitsu Career Ranking V1 (plan/handoff/ranking.md §9–§10; METHODOLOGY.md next to this file).
// SCORE = BASE_POINTS(placement) × EVENT_MULTIPLIER(tier). Only verified, official competitive results count; Hall of
// Fame never scores. Belts, gi/no-gi and gender are separate classifications.
import { z } from 'zod';

import type { ComputedEntry, RankingDefinition, RankingEvidence, RankingMethodology } from '../../core/engine';

export const BjjConfigSchema = z.object({
  placementPoints: z.array(z.object({ min: z.number().int(), max: z.number().int(), points: z.number() })).default([
    { min: 1, max: 1, points: 100 }, { min: 2, max: 2, points: 60 }, { min: 3, max: 3, points: 35 }, { min: 4, max: 4, points: 20 }, { min: 5, max: 8, points: 10 }, { min: 9, max: 16, points: 5 },
  ]),
  multipliers: z.record(z.string(), z.number()).default({ world: 10, international: 8, continental: 6, national: 4, grand_slam: 3, open: 2, regional: 1 }),
});
export type BjjConfig = z.infer<typeof BjjConfigSchema>;

const RANKINGS: RankingDefinition[] = [
  { key: 'black-gi-men', title: 'Black belt · gi · men', scope: { belt: 'black', giMode: 'gi', gender: 'men' } },
  { key: 'black-gi-women', title: 'Black belt · gi · women', scope: { belt: 'black', giMode: 'gi', gender: 'women' } },
  { key: 'nogi-men', title: 'No-gi · men', scope: { belt: null, giMode: 'no-gi', gender: 'men' } },
  { key: 'nogi-women', title: 'No-gi · women', scope: { belt: null, giMode: 'no-gi', gender: 'women' } },
];

export const basePoints = (placement: number, config: BjjConfig) => config.placementPoints.find((p) => placement >= p.min && placement <= p.max)?.points ?? 0;
const inScope = (e: RankingEvidence, r: RankingDefinition) =>
  e.kind === 'result' && e.attributes.giMode === r.scope.giMode && e.attributes.gender === r.scope.gender && (r.scope.belt === null || e.attributes.belt === r.scope.belt);
const eligible = (e: RankingEvidence) => e.attributes.verification === 'verified' && e.attributes.status === 'official' && typeof e.attributes.placement === 'number';

export const bjjCareer: RankingMethodology<BjjConfig> = {
  key: 'bjj-career',
  version: '1.0.0',
  sport: 'jiu-jitsu',
  outputKind: 'score',
  configSchema: BjjConfigSchema,
  defaultConfig: BjjConfigSchema.parse({}),
  rankings: () => RANKINGS,
  compute(ranking, input, config) {
    const byPerson = new Map<string, RankingEvidence[]>();
    for (const e of input.evidence) if (inScope(e, ranking)) (byPerson.get(e.competitorId) ?? byPerson.set(e.competitorId, []).get(e.competitorId)!).push(e);
    const out: ComputedEntry[] = [];
    for (const [competitorId, list] of byPerson) {
      const counted = list.filter(eligible);
      const items = counted.map((e) => {
        const points = basePoints(Number(e.attributes.placement), config) * (config.multipliers[String(e.attributes.tier)] ?? 0);
        return { evidenceId: e.id, contribution: points, note: `${e.attributes.competition} ${e.attributes.year} · ${e.attributes.division} · #${e.attributes.placement}` };
      });
      const gold = counted.filter((e) => e.attributes.placement === 1);
      const tierTitles = (tier: string) => gold.filter((e) => e.attributes.tier === tier).length;
      const score = items.reduce((s, i) => s + i.contribution, 0);
      out.push({
        competitorId,
        eligible: counted.length > 0,
        eligibilityReason: counted.length ? null : 'no verified official result (pending, disputed or not competitive)',
        score,
        band: null,
        metrics: { points: score, worldTitles: tierTitles('world'), continentalTitles: tierTitles('continental'), nationalTitles: tierTitles('national'), golds: gold.length, results: counted.length },
        items,
        // §10: score, then world, continental, national titles, golds, verified results.
        sortKey: [score, tierTitles('world'), tierTitles('continental'), tierTitles('national'), gold.length, counted.length],
      });
    }
    return out;
  },
};
