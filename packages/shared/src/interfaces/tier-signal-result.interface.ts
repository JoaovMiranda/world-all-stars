import type { Tier } from '../enums/tier.enum';

export interface TierSignalResult {
  /** Most-voted tier other than the official one (null without votes for other tiers). */
  topOther: Tier | null;
  /** Share (0–1) of the votes that went to `topOther`. */
  topOtherShare: number;
  /** Most-voted tier overall (ties keep the official one). */
  mostVoted: Tier | null;
  /** True when the rule of doc 17 fires: enough votes and a clear majority for another tier. */
  isSignal: boolean;
}
