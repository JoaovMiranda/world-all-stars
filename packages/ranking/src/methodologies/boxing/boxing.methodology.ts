// Boxing career ranking V1 (handoff §11.2, D10; METHODOLOGY.md next to this file).
// Score = organization-weighted titles + undisputed bonus + defenses + distinct divisions + Olympic medals + longevity
// + Hall of Fame, all from the versioned config. Rankings are pound-for-pound plus one per configured division;
// a division ranking is only eligible to boxers who won a title in it.
import { BaseMethodology } from '../../core/base.methodology';
import type { ComputedEntry } from '../../core/computed-entry.interface';
import type { RankingDefinition } from '../../core/ranking-definition.interface';
import type { RankingEvidence } from '../../core/ranking-evidence.interface';
import type { RankingInput } from '../../core/ranking-input.interface';
import { boxingRankings } from './boxing.const';
import { computeBoxingScore } from './boxing.helper';
import { BoxingConfigSchema } from './boxing-config.schema';
import type { BoxingConfig } from './boxing-config.type';

/** Boxing career ranking V1: organization-weighted titles, defenses, divisions, Olympics, longevity and Hall. */
export class BoxingMethodology extends BaseMethodology<BoxingConfig> {
  readonly key = 'boxing';
  readonly version = '1.0.0';
  readonly sport = 'boxing';
  readonly outputKind = 'score' as const;
  readonly configSchema = BoxingConfigSchema;

  rankings(config: BoxingConfig): RankingDefinition[] {
    return boxingRankings(config.divisions);
  }

  compute(ranking: RankingDefinition, input: RankingInput, config: BoxingConfig): ComputedEntry[] {
    const division = ranking.scope.division as string | null;
    const byPerson = new Map<string, RankingEvidence[]>();
    for (const e of input.evidence) {
      if (!['boxing_title', 'title_defense', 'olympic_medal', 'career', 'recognition'].includes(e.kind)) continue;
      (byPerson.get(e.competitorId) ?? byPerson.set(e.competitorId, []).get(e.competitorId)!).push(e);
    }
    const out: ComputedEntry[] = [];
    for (const [competitorId, list] of byPerson) {
      const career = computeBoxingScore(list, config);
      const titlesInDivision = division ? list.filter((e) => e.kind === 'boxing_title' && e.attributes.division === division).length : 0;
      const eligible = division ? titlesInDivision > 0 : career.metrics.titles > 0;
      out.push({
        competitorId,
        eligible,
        eligibilityReason: eligible ? null : division ? `no title in ${division}` : 'no counted title or Olympic medal',
        score: career.score,
        band: null,
        metrics: career.metrics,
        items: career.items,
        // Score, then titles, then defenses: the same order in every division and in the open ranking.
        sortKey: [career.score, career.metrics.titles, career.metrics.defenses],
      });
    }
    return out;
  }
}
