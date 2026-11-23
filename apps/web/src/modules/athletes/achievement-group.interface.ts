import type { CompetitionLevel } from '@was/shared';

/** Achievements of one competition or award, with the level of the first one. */
export interface AchievementGroup<A> {
  key: string;
  name: string;
  level: CompetitionLevel;
  items: A[];
}
