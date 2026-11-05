/** Athlete tiers (docs 08/17): Mythic = gold, Legendary = silver, Elite = bronze, Champion = neutral. */
export const Tier = {
  Mythic: 'mythic',
  Legendary: 'legendary',
  Elite: 'elite',
  Champion: 'champion',
} as const;
export type Tier = (typeof Tier)[keyof typeof Tier];
export const TIER_VALUES = Object.values(Tier) as [Tier, ...Tier[]];
