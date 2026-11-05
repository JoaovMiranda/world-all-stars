/** Competition levels (docs 03/09): world, continental, national, local. */
export const CompetitionLevel = {
  World: 'world',
  Continental: 'continental',
  National: 'national',
  Local: 'local',
} as const;
export type CompetitionLevel = (typeof CompetitionLevel)[keyof typeof CompetitionLevel];
export const COMPETITION_LEVEL_VALUES = Object.values(CompetitionLevel) as [CompetitionLevel, ...CompetitionLevel[]];
