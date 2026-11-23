// Jiu-Jitsu Career Ranking V1 (plan/handoff/ranking.md §9–§10; METHODOLOGY.md next to this file).
// SCORE = BASE_POINTS(placement) × EVENT_MULTIPLIER(tier). Only verified, official competitive results count; Hall of
// Fame never scores. Belts, gi/no-gi and gender are separate classifications.
import type { ComputedEntry } from '../../core/computed-entry.interface';
import type { RankingDefinition } from '../../core/ranking-definition.interface';
import type { RankingEvidence } from '../../core/ranking-evidence.interface';
import type { RankingMethodology } from '../../core/ranking-methodology.interface';
import { BJJ_CAREER_RANKINGS } from './bjj-career.const';
import { basePoints } from './bjj-career.helper';
import { BjjConfigSchema } from './bjj-config.schema';
import type { BjjConfig } from './bjj-config.type';

const inScope = (e: RankingEvidence, r: RankingDefinition) =>
  e.kind === 'result' &&
  e.attributes.giMode === r.scope.giMode &&
  e.attributes.gender === r.scope.gender &&
  (r.scope.belt === null || e.attributes.belt === r.scope.belt);
const eligible = (e: RankingEvidence) =>
  e.attributes.verification === 'verified' && e.attributes.status === 'official' && typeof e.attributes.placement === 'number';

export const bjjCareer: RankingMethodology<BjjConfig> = {
  key: 'bjj-career',
  version: '1.0.0',
  sport: 'jiu-jitsu',
  outputKind: 'score',
  configSchema: BjjConfigSchema,
  defaultConfig: BjjConfigSchema.parse({}),
  rankings: () => BJJ_CAREER_RANKINGS,
  compute(ranking, input, config) {
    const byPerson = new Map<string, RankingEvidence[]>();
    for (const e of input.evidence) if (inScope(e, ranking)) (byPerson.get(e.competitorId) ?? byPerson.set(e.competitorId, []).get(e.competitorId)!).push(e);
    const out: ComputedEntry[] = [];
    for (const [competitorId, list] of byPerson) {
      const counted = list.filter(eligible);
      const items = counted.map((e) => {
        const points = basePoints(Number(e.attributes.placement), config) * (config.multipliers[String(e.attributes.tier)] ?? 0);
        return {
          evidenceId: e.id,
          contribution: points,
          note: `${e.attributes.competition} ${e.attributes.year} · ${e.attributes.division} · #${e.attributes.placement}`,
        };
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
        metrics: {
          points: score,
          worldTitles: tierTitles('world'),
          continentalTitles: tierTitles('continental'),
          nationalTitles: tierTitles('national'),
          golds: gold.length,
          results: counted.length,
        },
        items,
        // §10: score, then world, continental, national titles, golds, verified results.
        sortKey: [score, tierTitles('world'), tierTitles('continental'), tierTitles('national'), gold.length, counted.length],
      });
    }
    return out;
  },
};
