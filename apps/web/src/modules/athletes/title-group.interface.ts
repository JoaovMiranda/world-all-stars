import type { AchievementType, CompetitionAchievement } from '@was/shared';

import type { AchievementGroup } from './achievement-group.interface';

/** Titles and medals of one competition (T4.3), split by result type (champion, gold, silver…). */
export interface TitleGroup extends AchievementGroup<CompetitionAchievement> {
  kinds: { type: AchievementType; items: CompetitionAchievement[] }[];
}
