/** An achievement comes from a competition edition or an award edition. */
export const AchievementKind = {
  Competition: 'competition',
  Award: 'award',
} as const;
export type AchievementKind = (typeof AchievementKind)[keyof typeof AchievementKind];
export const ACHIEVEMENT_KIND_VALUES = Object.values(AchievementKind) as [AchievementKind, ...AchievementKind[]];
