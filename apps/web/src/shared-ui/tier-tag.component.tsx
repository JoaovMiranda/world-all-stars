import type { Tier } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';

import { DOMAIN_LABELS_MESSAGES } from './domain-labels.const';

/** Tier badge with metallic border: Mythic gold · Legendary silver · Elite bronze · Champion neutral. */
export function TierTag({ tier }: { tier: Tier }) {
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  return <span className={`tag tag-tier-${tier}`}>{labels.tier[tier]}</span>;
}
