// Football World Champions V1 (plan/handoff/ranking-futebol.md §6–§8; METHODOLOGY.md next to this file).
// 1 credit per VERIFIED winning squad membership (registered or replacement, never withdrawn/rejected); at most one
// credit per player per edition. Rankings A–D by competition and gender; E is the consolidated overview.
import type { ComputedEntry } from '../../core/computed-entry.interface';
import type { RankingEvidence } from '../../core/ranking-evidence.interface';
import type { RankingMethodology } from '../../core/ranking-methodology.interface';
import { FOOTBALL_CHAMPIONS_RANKINGS, OLYMPICS, WORLD_CUPS } from './football-champions.const';
import { FootballConfigSchema } from './football-config.schema';
import type { FootballConfig } from './football-config.type';

const countable = (e: RankingEvidence, c: FootballConfig) =>
  e.kind === 'squad_membership' &&
  c.countableRegistration.includes(String(e.attributes.registration)) &&
  c.countableVerification.includes(String(e.attributes.verification));

export const footballChampions: RankingMethodology<FootballConfig> = {
  key: 'football-champions',
  version: '1.0.0',
  sport: 'football',
  outputKind: 'score',
  configSchema: FootballConfigSchema,
  defaultConfig: FootballConfigSchema.parse({}),
  rankings: () => FOOTBALL_CHAMPIONS_RANKINGS,
  compute(ranking, input, config) {
    const scope = ranking.scope.competition as string | null;
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
      const appeared = credits.filter((e) => e.attributes.appeared === true).length;
      const earliest = credits.length ? Math.min(...credits.map((e) => Number(e.attributes.year))) : 9999;
      const total = credits.length * config.creditPerTitle;
      const isWc = scope ? WORLD_CUPS.has(scope) : false;
      // §8: A/B → WC titles, verified appearances, earliest; C/D → golds, appearances, earliest; E → total, WC, golds.
      const sortKey = !scope ? [total, wc, og] : isWc ? [wc, appeared, -earliest] : [og, appeared, -earliest];
      out.push({
        competitorId,
        eligible: credits.length > 0,
        eligibilityReason: credits.length ? null : 'no verified winning squad membership (pending, disputed, rejected or withdrawn)',
        score: total,
        band: null,
        metrics: { credits: total, worldCups: wc, olympicGolds: og, verifiedAppearances: appeared, earliestYear: earliest === 9999 ? 0 : earliest },
        items: credits.map((e) => ({ evidenceId: e.id, contribution: config.creditPerTitle, note: `${e.attributes.competition} ${e.attributes.year}` })),
        sortKey,
      });
    }
    return out;
  },
};
