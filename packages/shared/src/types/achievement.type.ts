import type { AchievementKind } from '../enums/achievement-kind.enum';
import type { Achievement } from './athlete-profile.type';

export type CompetitionAchievement = Extract<Achievement, { kind: typeof AchievementKind.Competition }>;
export type AwardAchievement = Extract<Achievement, { kind: typeof AchievementKind.Award }>;
