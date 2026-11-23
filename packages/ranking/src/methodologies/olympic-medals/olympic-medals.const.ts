import type { RankingDefinition } from '../../core/ranking-definition.interface';

/** One overall ranking plus one ranking per configured sport (config.sports). */
export const olympicMedalsRankings = (sports: string[]): RankingDefinition[] => [
  { key: 'overall', title: 'Olympic medals — all sports', scope: { sport: null } },
  ...sports.map((sport) => ({ key: `sport-${sport}`, title: `Olympic medals — ${sport}`, scope: { sport } })),
];

export const OLYMPIC_MEDALS = ['gold', 'silver', 'bronze'] as const;
