import { type AthleteSummary, Tier } from '@was/shared';

import { demoStore } from '../demo.store';

/** Applies an official tier changed by the admin in the demo (fixture mode) to any athlete payload. */
export const withDemoTier = <A extends Pick<AthleteSummary, 'slug' | 'tier'> & { isHallOfGreats?: boolean }>(athlete: A): A => {
  const change = demoStore.get().officialTiers[athlete.slug];
  if (!change) return athlete;
  return { ...athlete, tier: change.tier, ...('isHallOfGreats' in athlete ? { isHallOfGreats: change.tier === Tier.Mythic } : {}) };
};
