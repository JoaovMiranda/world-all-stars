import type { RankingEvidence } from '../../core/ranking-evidence.interface';
import type { IronmanConfig } from './ironman-config.type';

/** A counted finish: a world-championship title, a podium there, or any course record. */
export const computeIronmanScore = (list: RankingEvidence[], config: IronmanConfig, event: string | null = null) => {
  const scoped = list.filter((e) => e.kind === 'ironman_result' && (event === null || e.attributes.event === event));
  const championship = scoped.filter((e) => config.worldChampionshipSlugs.includes(String(e.attributes.event)));
  const titles = championship.filter((e) => Number(e.attributes.placement) === 1);
  const podiums = championship.filter((e) => {
    const placement = Number(e.attributes.placement);
    return placement >= 2 && placement <= 3;
  });
  const records = scoped.filter((e) => e.attributes.courseRecord === true);
  const items = [
    ...titles.map((e) => ({ evidenceId: e.id, contribution: config.titlePoints, note: `world title ${e.attributes.year}` })),
    ...podiums.map((e) => ({ evidenceId: e.id, contribution: config.podiumPoints, note: `podium ${e.attributes.placement} ${e.attributes.year}` })),
    ...records.map((e) => ({ evidenceId: e.id, contribution: config.courseRecordPoints, note: `course record ${e.attributes.event} ${e.attributes.year}` })),
  ];
  return {
    score: items.reduce((sum, item) => sum + item.contribution, 0),
    items,
    metrics: {
      worldTitles: titles.length,
      podiums: podiums.length,
      courseRecords: records.length,
      finishes: scoped.length,
    },
  };
};
