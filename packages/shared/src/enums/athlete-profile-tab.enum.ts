/** Tabs of the athlete profile (doc 09 P2), synced to `?tab=`. */
export const AthleteProfileTab = {
  Overview: 'overview',
  Achievements: 'achievements',
  Career: 'career',
  Analysis: 'analysis',
  Sources: 'sources',
  Comments: 'comments',
} as const;
export type AthleteProfileTab = (typeof AthleteProfileTab)[keyof typeof AthleteProfileTab];
export const ATHLETE_PROFILE_TAB_VALUES = Object.values(AthleteProfileTab) as [AthleteProfileTab, ...AthleteProfileTab[]];
