// Football champions V1 (plan/handoff/ranking-futebol.md §6–§8; METHODOLOGY.md next to this file).
// 1 credit per VERIFIED winning squad membership (registered or replacement, never withdrawn/rejected); at most one
// credit per player per edition. One ranking per competition family and gender, one per continental championship and
// the consolidated overview (D05/D06); starting the final is a metric, never an eligibility rule.
import { BaseMethodology } from '../../core/base.methodology';
import type { ComputedEntry } from '../../core/computed-entry.interface';
import type { RankingDefinition } from '../../core/ranking-definition.interface';
import type { RankingEvidence } from '../../core/ranking-evidence.interface';
import type { RankingInput } from '../../core/ranking-input.interface';
import { OLYMPICS, WORLD_CUPS, footballRankings } from './football-champions.const';
import { countable } from './football-champions.helper';
import { FootballConfigSchema } from './football-config.schema';
import type { FootballConfig } from './football-config.type';

/** Football champions V1: one credit per verified winning squad membership (METHODOLOGY.md). */
export class FootballChampionsMethodology extends BaseMethodology<FootballConfig> {
  readonly key = 'football-champions';
  readonly version = '1.1.0';
  readonly sport = 'football';
  readonly outputKind = 'score' as const;
  readonly configSchema = FootballConfigSchema;

  rankings(config: FootballConfig): RankingDefinition[] {
    return footballRankings(config.continental);
  }

  compute(ranking: RankingDefinition, input: RankingInput, config: FootballConfig): ComputedEntry[] {
    const scope = ranking.scope.competition as string | null;
    const continentalSlugs = new Set(config.continental.map((c) => c.competition));
    const byPerson = new Map<string, RankingEvidence[]>();
    for (const e of input.evidence)
      if (e.kind === 'squad_membership' && (!scope || e.attributes.competition === scope))
        (byPerson.get(e.competitorId) ?? byPerson.set(e.competitorId, []).get(e.competitorId)!).push(e);
    const out: ComputedEntry[] = [];
    for (const [competitorId, list] of byPerson) {
      const counted = new Map<string, RankingEvidence>(); // one credit per edition (duplicates ignored)
      for (const e of list)
        if (countable(e, config))
          counted.set(`${e.attributes.competition}:${e.attributes.year}`, counted.get(`${e.attributes.competition}:${e.attributes.year}`) ?? e);
      const credits = [...counted.values()];
      const wc = credits.filter((e) => WORLD_CUPS.has(String(e.attributes.competition))).length;
      const og = credits.filter((e) => OLYMPICS.has(String(e.attributes.competition))).length;
      const continental = credits.filter((e) => continentalSlugs.has(String(e.attributes.competition))).length;
      const appeared = credits.filter((e) => e.attributes.appeared === true).length;
      const earliest = credits.length ? Math.min(...credits.map((e) => Number(e.attributes.year))) : 9999;
      const total = credits.length * config.creditPerTitle;
      // §8: a single competition ranks by its own titles; the overview by total, then World Cups, continental titles and
      // Olympic golds. Verified appearances break ties before the earliest title.
      const sortKey = !scope ? [total, wc, continental, og] : [total, appeared, -earliest];
      out.push({
        competitorId,
        eligible: credits.length > 0,
        eligibilityReason: credits.length ? null : 'no verified winning squad membership (pending, disputed, rejected or withdrawn)',
        score: total,
        band: null,
        metrics: {
          credits: total,
          titles: credits.length,
          worldCups: wc,
          continentalTitles: continental,
          olympicGolds: og,
          verifiedAppearances: appeared,
          earliestYear: earliest === 9999 ? 0 : earliest,
        },
        items: credits.map((e) => ({ evidenceId: e.id, contribution: config.creditPerTitle, note: `${e.attributes.competition} ${e.attributes.year}` })),
        sortKey,
      });
    }
    return out;
  }
}
