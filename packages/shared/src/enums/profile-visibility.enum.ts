/** Public profile of a competitor, independent of its existence and ranking eligibility (C02). */
export const ProfileVisibility = {
  Public: 'public',
  Unlisted: 'unlisted',
  None: 'none',
} as const;
export type ProfileVisibility = (typeof ProfileVisibility)[keyof typeof ProfileVisibility];
export const PROFILE_VISIBILITY_VALUES = Object.values(ProfileVisibility) as [ProfileVisibility, ...ProfileVisibility[]];
