/** Confidence needed for an automatic merge and for a human review (calibrated by pnpm ingest:identity-eval). */
export const IDENTITY_THRESHOLDS = { auto: 0.98, review: 0.75 } as const;
