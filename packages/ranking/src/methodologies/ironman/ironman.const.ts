import type { RankingDefinition } from '../../core/ranking-definition.interface';

/** One world-championship ranking plus the overall career list. */
export const ironmanRankings = (slugs: string[]): RankingDefinition[] => [
  { key: 'overall', title: 'Ironman — career', scope: { event: null } },
  ...slugs.map((event) => ({ key: `event-${event}`, title: `Ironman — ${event}`, scope: { event } })),
];
