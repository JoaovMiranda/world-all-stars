/** Result type of an achievement (achievement_types.slug). */
export const AchievementType = {
  Champion: 'champion',
  Gold: 'gold',
  Silver: 'silver',
  Bronze: 'bronze',
  TitleWon: 'title_won',
  RunnerUp: 'runner_up',
  Mvp: 'mvp',
  Award: 'award',
  Ranking: 'ranking',
  HallOfFame: 'hall_of_fame',
} as const;
export type AchievementType = (typeof AchievementType)[keyof typeof AchievementType];
export const ACHIEVEMENT_TYPE_VALUES = Object.values(AchievementType) as [AchievementType, ...AchievementType[]];
