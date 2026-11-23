import type { RankingDefinition } from '../../core/ranking-definition.interface';

export const WORLD_CUPS = new Set(['fifa-world-cup', 'fifa-womens-world-cup']);
export const OLYMPICS = new Set(['olympic-football', 'olympic-football-women']);
/** Rankings A–D by competition and gender; E is the consolidated overview. */
export const FOOTBALL_CHAMPIONS_RANKINGS: RankingDefinition[] = [
  { key: 'A', title: "Men's FIFA World Cup champions", scope: { competition: 'fifa-world-cup' } },
  { key: 'B', title: "Women's FIFA World Cup champions", scope: { competition: 'fifa-womens-world-cup' } },
  { key: 'C', title: "Men's Olympic football champions", scope: { competition: 'olympic-football' } },
  { key: 'D', title: "Women's Olympic football champions", scope: { competition: 'olympic-football-women' } },
  { key: 'E', title: 'All-time football champions overview', scope: { competition: null } },
];
