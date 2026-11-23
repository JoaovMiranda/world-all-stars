import { Tier } from '../enums/tier.enum';

/** Display order of tiers (highest first). */
export const TIER_ORDER = [Tier.Mythic, Tier.Legendary, Tier.Elite, Tier.Champion] as const satisfies readonly Tier[];

// Tiers no longer use the medal colors: each tier has its own tokens (--tier-X, --tier-X-fill, --tier-X-grad) in theme/theme.css.
