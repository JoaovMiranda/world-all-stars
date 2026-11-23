// Ironman ranking V1 (handoff §11.2; METHODOLOGY.md next to this file).
// World championship titles, podiums at the championship and course records; rankings are the overall career and one
// per world-championship event.
import { BaseMethodology } from '../../core/base.methodology';
import type { ComputedEntry } from '../../core/computed-entry.interface';
import type { RankingDefinition } from '../../core/ranking-definition.interface';
import type { RankingEvidence } from '../../core/ranking-evidence.interface';
import type { RankingInput } from '../../core/ranking-input.interface';
import { ironmanRankings } from './ironman.const';
import { computeIronmanScore } from './ironman.helper';
import { IronmanConfigSchema } from './ironman-config.schema';
import type { IronmanConfig } from './ironman-config.type';

/** Ironman ranking V1: world titles, championship podiums and course records. */
export class IronmanMethodology extends BaseMethodology<IronmanConfig> {
  readonly key = 'ironman';
  readonly version = '1.0.0';
  readonly sport = 'ironman';
  readonly outputKind = 'score' as const;
  readonly configSchema = IronmanConfigSchema;

  rankings(config: IronmanConfig): RankingDefinition[] {
    return ironmanRankings(config.worldChampionshipSlugs);
  }

  compute(ranking: RankingDefinition, input: RankingInput, config: IronmanConfig): ComputedEntry[] {
    const event = ranking.scope.event as string | null;
    const byPerson = new Map<string, RankingEvidence[]>();
    for (const e of input.evidence) {
      if (e.kind !== 'ironman_result') continue;
      (byPerson.get(e.competitorId) ?? byPerson.set(e.competitorId, []).get(e.competitorId)!).push(e);
    }
    const out: ComputedEntry[] = [];
    for (const [competitorId, list] of byPerson) {
      const result = computeIronmanScore(list, config, event);
      out.push({
        competitorId,
        eligible: result.metrics.worldTitles + result.metrics.podiums > 0,
        eligibilityReason: result.metrics.worldTitles + result.metrics.podiums > 0 ? null : 'no world championship title or podium',
        score: result.score,
        band: null,
        metrics: result.metrics,
        items: result.items,
        // Score, then world titles, then podiums, then course records.
        sortKey: [result.score, result.metrics.worldTitles, result.metrics.podiums, result.metrics.courseRecords],
      });
    }
    return out;
  }
}
