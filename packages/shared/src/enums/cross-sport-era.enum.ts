/** Era filter of `/rankings/all-sports` (by the year of an accepted item). */
export const CrossSportEra = {
  Until1949: 'until-1949',
  From1950To1969: '1950-1969',
  From1970To1989: '1970-1989',
  From1990To2009: '1990-2009',
  Since2010: 'since-2010',
} as const;
export type CrossSportEra = (typeof CrossSportEra)[keyof typeof CrossSportEra];
export const CROSS_SPORT_ERA_VALUES = Object.values(CrossSportEra) as [CrossSportEra, ...CrossSportEra[]];
