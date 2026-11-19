/** Review state of one field value (C07). */
export const ProvenanceReviewStatus = {
  AutoAccepted: 'auto_accepted',
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  Superseded: 'superseded',
} as const;
export type ProvenanceReviewStatus = (typeof ProvenanceReviewStatus)[keyof typeof ProvenanceReviewStatus];
export const PROVENANCE_REVIEW_STATUS_VALUES = Object.values(ProvenanceReviewStatus) as [ProvenanceReviewStatus, ...ProvenanceReviewStatus[]];
