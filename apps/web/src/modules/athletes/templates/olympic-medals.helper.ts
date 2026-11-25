import { AchievementType, type AthleteProfile, isCompetitionAchievement } from '@was/shared';

import type { OlympicTally } from './olympic-tally.interface';

const METAL_OF: Partial<Record<AchievementType, 'gold' | 'silver' | 'bronze'>> = {
  [AchievementType.Gold]: 'gold',
  [AchievementType.Champion]: 'gold',
  [AchievementType.Silver]: 'silver',
  [AchievementType.RunnerUp]: 'silver',
  [AchievementType.Bronze]: 'bronze',
};

/** Olympic medals of the profile (results of Olympic competitions), per metal, with the medal years ascending. */
export const olympicTally = (profile: AthleteProfile): OlympicTally => {
  const tally: OlympicTally = { gold: 0, silver: 0, bronze: 0, years: [] };
  const years = new Set<number>();
  for (const a of profile.achievements.filter(isCompetitionAchievement)) {
    const metal = a.isOlympic ? METAL_OF[a.type] : undefined;
    if (!metal) continue;
    tally[metal] += 1;
    years.add(a.year);
  }
  tally.years = [...years].sort((x, y) => x - y);
  return tally;
};
