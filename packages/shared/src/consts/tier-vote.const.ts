/** Admin "tier signals" queue: most-voted tier differs from the official one (doc 17). */
export const TIER_SIGNAL_MIN_VOTES = 30;
export const TIER_SIGNAL_MIN_SHARE = 0.6;

/** Tier-vote anti-fraud (T3.2): an account votes only after this age. */
export const TIER_VOTE_MIN_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1000;
/** Anomaly rule: at least this many votes on one athlete … */
export const TIER_VOTE_ANOMALY_MIN_VOTES = 30;
/** … cast (or changed) within this window … */
export const TIER_VOTE_ANOMALY_WINDOW_MS = 60 * 60 * 1000;
/** … by accounts younger than this flags those accounts for review. */
export const TIER_VOTE_ANOMALY_ACCOUNT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
