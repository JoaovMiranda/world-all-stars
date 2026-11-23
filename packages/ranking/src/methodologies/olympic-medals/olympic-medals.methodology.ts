// Olympic medals ranking V1 (handoff §11.2, D08–D09; METHODOLOGY.md next to this file).
// Gold/silver/bronze are weighted by the versioned config; a team medal credits each member of the entry. Rankings are
// one overall list plus one per configured sport; the medal table per NOC and edition is a separate classification.
import { BaseMethodology } from '../../core/base.methodology';
import type { ComputedEntry } from '../../core/computed-entry.interface';
import type { RankingDefinition } from '../../core/ranking-definition.interface';
import type { RankingEvidence } from '../../core/ranking-evidence.interface';
import type { RankingInput } from '../../core/ranking-input.interface';
import { olympicMedalsRankings } from './olympic-medals.const';
import { computeOlympicMedalScore } from './olympic-medals.helper';
import { OlympicMedalsConfigSchema } from './olympic-medals-config.schema';
import type { OlympicMedalsConfig } from './olympic-medals-config.type';

/** Olympic medals ranking V1: weighted gold/silver/bronze, overall and per sport. */
export class OlympicMedalsMethodology extends BaseMethodology<OlympicMedalsConfig> {
  readonly key = 'olympic-medals';
  readonly version = '1.0.0';
  readonly sport = null;
  readonly outputKind = 'score' as const;
  readonly configSchema = OlympicMedalsConfigSchema;

  rankings(config: OlympicMedalsConfig): RankingDefinition[] {
    return olympicMedalsRankings(config.sports);
  }

  compute(ranking: RankingDefinition, input: RankingInput, config: OlympicMedalsConfig): ComputedEntry[] {
    const sport = ranking.scope.sport as string | null;
    const byPerson = new Map<string, RankingEvidence[]>();
    for (const e of input.evidence) {
      if (e.kind !== 'olympic_medal') continue;
      (byPerson.get(e.competitorId) ?? byPerson.set(e.competitorId, []).get(e.competitorId)!).push(e);
    }
    const out: ComputedEntry[] = [];
    for (const [competitorId, list] of byPerson) {
      const result = computeOlympicMedalScore(list, config, sport);
      out.push({
        competitorId,
        eligible: result.metrics.medals > 0,
        eligibilityReason: result.metrics.medals > 0 ? null : sport ? `no medal in ${sport}` : 'no counted Olympic medal',
        score: result.score,
        band: null,
        metrics: result.metrics,
        items: result.items,
        // §11.2: weighted total, then golds, silvers and bronzes, then the earliest medal.
        sortKey: [result.score, result.metrics.gold, result.metrics.silver, result.metrics.bronze, -result.metrics.earliestYear],
      });
    }
    return out;
  }
}
