// Jiu-Jitsu Career Ranking V1 (plan/handoff/ranking.md §9–§10; METHODOLOGY.md next to this file).
// SCORE = BASE_POINTS(placement) × EVENT_MULTIPLIER(tier). Only verified, official competitive results count; Hall of
// Fame never scores. Belts, gi/no-gi and gender are separate classifications.
import { BaseMethodology } from '../../core/base.methodology';
import type { ComputedEntry } from '../../core/computed-entry.interface';
import type { RankingDefinition } from '../../core/ranking-definition.interface';
import type { RankingEvidence } from '../../core/ranking-evidence.interface';
import type { RankingInput } from '../../core/ranking-input.interface';
import { BJJ_CAREER_RANKINGS } from './bjj-career.const';
import { basePoints, bjjCountedResult, bjjInScope } from './bjj-career.helper';
import { BjjConfigSchema } from './bjj-config.schema';
import type { BjjConfig } from './bjj-config.type';

/** Jiu-Jitsu Career Ranking V1: placement points × event multiplier over verified official results (METHODOLOGY.md). */
export class BjjCareerMethodology extends BaseMethodology<BjjConfig> {
  readonly key = 'bjj-career';
  readonly version = '1.0.0';
  readonly sport = 'jiu-jitsu';
  readonly outputKind = 'score' as const;
  readonly configSchema = BjjConfigSchema;

  rankings(_config: BjjConfig): RankingDefinition[] {
    return BJJ_CAREER_RANKINGS;
  }

  compute(ranking: RankingDefinition, input: RankingInput, config: BjjConfig): ComputedEntry[] {
    const byPerson = new Map<string, RankingEvidence[]>();
    for (const e of input.evidence) if (bjjInScope(e, ranking)) (byPerson.get(e.competitorId) ?? byPerson.set(e.competitorId, []).get(e.competitorId)!).push(e);
    const out: ComputedEntry[] = [];
    for (const [competitorId, list] of byPerson) {
      const counted = list.filter(bjjCountedResult);
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
  }
}
