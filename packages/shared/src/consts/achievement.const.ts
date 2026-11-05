import { AchievementType } from '../enums/achievement-type.enum';

/** Result types that count as winning a competition (titles, legacy, analysis curves): champion, gold, title won. */
export const WINNING_ACHIEVEMENT_TYPES = [AchievementType.Champion, AchievementType.Gold, AchievementType.TitleWon] as const satisfies readonly AchievementType[];
/** Olympic-style medal results, in podium order. */
export const MEDAL_ACHIEVEMENT_TYPES = [AchievementType.Gold, AchievementType.Silver, AchievementType.Bronze] as const satisfies readonly AchievementType[];
