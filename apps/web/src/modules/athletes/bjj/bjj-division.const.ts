import { AchievementType } from '@was/shared';

/** Dimension slugs of a BJJ division (category_dimensions.slug). */
export const BJJ_DIMENSION = { belt: 'belt', gi: 'gi_mode', weight: 'weight', sex: 'sex_category', age: 'age' } as const;

/** Weight values that mean the open (absolute) division, whatever the organization calls it. */
export const BJJ_ABSOLUTE_PATTERN = /absolut|open/i;

/** Placement implied by the result type when the result has no explicit rank. */
export const BJJ_PLACEMENT_BY_TYPE: Partial<Record<AchievementType, number>> = {
  [AchievementType.Champion]: 1,
  [AchievementType.Gold]: 1,
  [AchievementType.TitleWon]: 1,
  [AchievementType.RunnerUp]: 2,
  [AchievementType.Silver]: 2,
  [AchievementType.Bronze]: 3,
};

/** Podium placements shown as placement classes (1st · 2nd · 3rd) with their medal metal. */
export const BJJ_PODIUM = [
  { place: 1, metal: 'gold' },
  { place: 2, metal: 'silver' },
  { place: 3, metal: 'bronze' },
] as const;
