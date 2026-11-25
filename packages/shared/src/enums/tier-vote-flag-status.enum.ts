/**
 * Review state of an account flagged by the tier-vote anomaly rule (T3.2). While `pending` or `rejected` its votes are
 * left out of the admin "Tier signals"; `cleared` (reviewed, legitimate) counts them again.
 */
export const TierVoteFlagStatus = {
  Pending: 'pending',
  Cleared: 'cleared',
  Rejected: 'rejected',
} as const;
export type TierVoteFlagStatus = (typeof TierVoteFlagStatus)[keyof typeof TierVoteFlagStatus];
export const TIER_VOTE_FLAG_STATUS_VALUES = Object.values(TierVoteFlagStatus) as [TierVoteFlagStatus, ...TierVoteFlagStatus[]];
