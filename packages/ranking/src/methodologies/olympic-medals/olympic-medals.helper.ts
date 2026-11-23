import type { RankingEvidence } from '../../core/ranking-evidence.interface';
import type { OlympicMedalsConfig } from './olympic-medals-config.type';
import { OLYMPIC_MEDALS } from './olympic-medals.const';
import type { MedalTableRow } from './medal-table-row.interface';

/** A medal is counted only for a known medal class and an athlete credited by its confederation (team or individual). */
export const olympicMedalClass = (e: RankingEvidence): (typeof OLYMPIC_MEDALS)[number] | null =>
  e.kind === 'olympic_medal' && OLYMPIC_MEDALS.includes(String(e.attributes.medal) as never) ? (String(e.attributes.medal) as (typeof OLYMPIC_MEDALS)[number]) : null;

/** Weighted medal total and its breakdown for one scope (overall, or one sport). */
export const computeOlympicMedalScore = (list: RankingEvidence[], config: OlympicMedalsConfig, sport: string | null = null) => {
  const counted = list.filter(
    (e) => olympicMedalClass(e) && (sport === null || e.attributes.sport === sport) && (config.teamMedalCreditsMembers || e.attributes.team !== true),
  );
  const items = counted.map((e) => ({ evidenceId: e.id, contribution: config.weights[olympicMedalClass(e)!], note: `${e.attributes.medal} ${e.attributes.sport} ${e.attributes.year}` }));
  const gold = counted.filter((e) => olympicMedalClass(e) === 'gold').length;
  const silver = counted.filter((e) => olympicMedalClass(e) === 'silver').length;
  const bronze = counted.filter((e) => olympicMedalClass(e) === 'bronze').length;
  const earliestUrl = counted.length ? Math.min(...counted.map((e) => Number(e.attributes.year))) : 0;
  return {
    score: items.reduce((sum, item) => sum + item.contribution, 0),
    items,
    metrics: {
      gold,
      silver,
      bronze,
      medals: counted.length,
      sports: new Set(counted.map((e) => String(e.attributes.sport))).size,
      earliestYear: earliestUrl,
    },
  };
};

/**
 * Medal table of a nation at an edition (a classification, never a ranking of people): the official public readout of
 * the Olympic data, ordered by gold, silver, bronze and NOC.
 */
export const olympicMedalTable = (list: RankingEvidence[], scope: { sport?: string | null; year?: number | null; edition?: string | null } = {}): MedalTableRow[] => {
  const rows = new Map<string, MedalTableRow>();
  for (const e of list) {
    const medal = olympicMedalClass(e);
    if (!medal) continue;
    if (scope.sport != null && e.attributes.sport !== scope.sport) continue;
    if (scope.year != null && Number(e.attributes.year) !== scope.year) continue;
    if (scope.edition != null && e.attributes.edition !== scope.edition) continue;
    const noc = String(e.attributes.noc ?? 'UNK');
    const row = rows.get(noc) ?? { noc, gold: 0, silver: 0, bronze: 0, total: 0 };
    row[medal]++;
    row.total++;
    rows.set(noc, row);
  }
  return [...rows.values()].sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze || a.noc.localeCompare(b.noc));
};
