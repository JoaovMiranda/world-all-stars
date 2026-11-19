/** Documented gender of a person (not a competition category: that is the sex_category dimension). */
export const Gender = {
  Male: 'male',
  Female: 'female',
  Unknown: 'unknown',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];
export const GENDER_VALUES = Object.values(Gender) as [Gender, ...Gender[]];
