import type { RankingDefinition } from '../../core/ranking-definition.interface';

/** Competitions whose title the methodology credits (D06). Continental slugs are validated per source in T5.3. */
export const WORLD_CUPS = new Set(['fifa-world-cup', 'fifa-womens-world-cup']);
export const OLYMPICS = new Set(['olympic-football', 'olympic-football-women']);

/** Continental championships shipped with the ruleset: one separate ranking per family and gender (D06). */
export const FOOTBALL_CONTINENTAL = [
  { confederation: 'conmebol', gender: 'men', competition: 'copa-america' },
  { confederation: 'uefa', gender: 'men', competition: 'uefa-euro' },
  { confederation: 'caf', gender: 'men', competition: 'africa-cup-of-nations' },
  { confederation: 'afc', gender: 'men', competition: 'afc-asian-cup' },
  { confederation: 'concacaf', gender: 'men', competition: 'concacaf-gold-cup' },
  { confederation: 'ofc', gender: 'men', competition: 'ofc-nations-cup' },
  { confederation: 'conmebol', gender: 'women', competition: 'copa-america-femenina' },
  { confederation: 'uefa', gender: 'women', competition: 'uefa-womens-euro' },
  { confederation: 'caf', gender: 'women', competition: 'womens-africa-cup-of-nations' },
  { confederation: 'afc', gender: 'women', competition: 'afc-womens-asian-cup' },
  { confederation: 'concacaf', gender: 'women', competition: 'concacaf-womens-championship' },
  { confederation: 'ofc', gender: 'women', competition: 'ofc-womens-nations-cup' },
] as const;

/** Continental competitions accepted by the ruleset (exported for the fixtures and the provider validation). */
export const FOOTBALL_CONTINENTAL_COMPETITIONS = FOOTBALL_CONTINENTAL.map((c) => c.competition);

/** Rankings A–D by competition family and gender, one per continental championship, and the consolidated overview. */
export const footballRankings = (continental: readonly { confederation: string; gender: string; competition: string }[]): RankingDefinition[] => [
  { key: 'world-cup-men', title: "Men's FIFA World Cup champions", scope: { competition: 'fifa-world-cup', family: 'world-cup', gender: 'men' } },
  { key: 'world-cup-women', title: "Women's FIFA World Cup champions", scope: { competition: 'fifa-womens-world-cup', family: 'world-cup', gender: 'women' } },
  { key: 'olympic-men', title: "Men's Olympic football champions", scope: { competition: 'olympic-football', family: 'olympic', gender: 'men' } },
  { key: 'olympic-women', title: "Women's Olympic football champions", scope: { competition: 'olympic-football-women', family: 'olympic', gender: 'women' } },
  ...continental.map((c) => ({
    key: `continental-${c.confederation}-${c.gender}`,
    title: `Continental champions — ${c.confederation} ${c.gender}`,
    scope: { competition: c.competition, family: 'continental', gender: c.gender },
  })),
  { key: 'overview', title: 'All-time football champions overview', scope: { competition: null, family: null, gender: null } },
];
