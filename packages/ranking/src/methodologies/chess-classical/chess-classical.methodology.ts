// Chess ranking V1 (handoff §11.2; METHODOLOGY.md next to this file).
// World titles by time control, peak rating and years as world number one; sources are Wikipedia/Wikidata (FIDE is
// link-only). Rankings are overall plus one per time control.
import { BaseMethodology } from '../../core/base.methodology';
import type { ComputedEntry } from '../../core/computed-entry.interface';
import type { RankingDefinition } from '../../core/ranking-definition.interface';
import type { RankingEvidence } from '../../core/ranking-evidence.interface';
import type { RankingInput } from '../../core/ranking-input.interface';
import { chessRankings } from './chess-classical.const';
import { computeChessScore } from './chess-classical.helper';
import { ChessConfigSchema } from './chess-config.schema';
import type { ChessConfig } from './chess-config.type';

/** Chess ranking V1: world titles by time control, peak rating and years as world number one. */
export class ChessClassicalMethodology extends BaseMethodology<ChessConfig> {
  readonly key = 'chess-classical';
  readonly version = '1.0.0';
  readonly sport = 'chess';
  readonly outputKind = 'score' as const;
  readonly configSchema = ChessConfigSchema;

  rankings(config: ChessConfig): RankingDefinition[] {
    return chessRankings(config.formats);
  }

  compute(ranking: RankingDefinition, input: RankingInput, config: ChessConfig): ComputedEntry[] {
    const format = ranking.scope.format as string | null;
    const byPerson = new Map<string, RankingEvidence[]>();
    for (const e of input.evidence) {
      if (!['chess_title', 'chess_rating', 'chess_number_one'].includes(e.kind)) continue;
      (byPerson.get(e.competitorId) ?? byPerson.set(e.competitorId, []).get(e.competitorId)!).push(e);
    }
    const out: ComputedEntry[] = [];
    for (const [competitorId, list] of byPerson) {
      const result = computeChessScore(list, config, format);
      const titles = result.metrics.classicalTitles + result.metrics.rapidTitles + result.metrics.blitzTitles;
      out.push({
        competitorId,
        eligible: titles > 0 || result.metrics.yearsAsNumberOne > 0,
        eligibilityReason: titles > 0 || result.metrics.yearsAsNumberOne > 0 ? null : format ? `no ${format} world title` : 'no world title or year as #1',
        score: result.score,
        band: null,
        metrics: result.metrics,
        items: result.items,
        // Score, then classical titles, then peak rating.
        sortKey: [result.score, result.metrics.classicalTitles, result.metrics.peakRating],
      });
    }
    return out;
  }
}
