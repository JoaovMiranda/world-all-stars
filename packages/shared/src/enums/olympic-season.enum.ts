/** Season of an Olympic Games edition (`olympic-games-summer` / `olympic-games-winter`). */
export const OlympicSeason = {
  Summer: 'summer',
  Winter: 'winter',
} as const;
export type OlympicSeason = (typeof OlympicSeason)[keyof typeof OlympicSeason];
export const OLYMPIC_SEASON_VALUES = Object.values(OlympicSeason) as [OlympicSeason, ...OlympicSeason[]];
