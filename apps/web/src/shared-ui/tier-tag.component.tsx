import type { Tier } from '@was/shared';

import { TIER_LABEL } from './domain-labels.const';

/** Tier badge with metallic border: Mítico gold · Lendário silver · Elite bronze · Campeão neutral. */
export function TierTag({ tier }: { tier: Tier }) {
  return <span className={`tag tag-tier-${tier}`}>{TIER_LABEL[tier]}</span>;
}
