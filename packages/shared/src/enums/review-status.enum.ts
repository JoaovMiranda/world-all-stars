/** Status of an item in an admin review queue (crawler proposals, conflicts). */
export const ReviewStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  Skipped: 'skipped',
} as const;
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];
export const REVIEW_STATUS_VALUES = Object.values(ReviewStatus) as [ReviewStatus, ...ReviewStatus[]];
