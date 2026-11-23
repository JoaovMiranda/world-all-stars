import type { RankingDefinition } from '../../core/ranking-definition.interface';

/** One open pound-for-pound ranking plus one ranking per configured division (config.divisions). */
export const boxingRankings = (divisions: string[]): RankingDefinition[] => [
  { key: 'open', title: 'Boxing — pound-for-pound (all divisions)', scope: { division: null } },
  ...divisions.map((division) => ({ key: `division-${division}`, title: `Boxing — ${division}`, scope: { division } })),
];

/** Career designation of a boxer, from the score thresholds of the config. */
export const boxingDesignation = (score: number, config: { designations: { mythical: number; legendary: number; champion: number } }) =>
  score >= config.designations.mythical ? 'mythical' : score >= config.designations.legendary ? 'legendary' : score >= config.designations.champion ? 'champion' : 'contender';
