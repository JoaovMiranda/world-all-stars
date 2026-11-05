import { Tier } from '../enums/tier.enum';

/** Display order of tiers (highest first). */
export const TIER_ORDER = [Tier.Mythic, Tier.Legendary, Tier.Elite, Tier.Champion] as const satisfies readonly Tier[];

/** Medal metal used by each tier (CSS tokens --medal-* / --grad-*). Champion has no metal. */
export const TIER_MEDAL = {
  [Tier.Mythic]: 'gold',
  [Tier.Legendary]: 'silver',
  [Tier.Elite]: 'bronze',
  [Tier.Champion]: null,
} as const satisfies Record<Tier, 'gold' | 'silver' | 'bronze' | null>;
