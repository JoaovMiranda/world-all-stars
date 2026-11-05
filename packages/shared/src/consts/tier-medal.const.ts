import { Tier } from '../enums/tier.enum';

/** Display order of tiers (highest first). */
export const TIER_ORDER = [Tier.Mythic, Tier.Legendary, Tier.Elite, Tier.Champion] as const satisfies readonly Tier[];

// Níveis não usam mais as cores de medalha: cada nível tem seus tokens (--tier-X, --tier-X-fill, --tier-X-grad) em theme/theme.css.
