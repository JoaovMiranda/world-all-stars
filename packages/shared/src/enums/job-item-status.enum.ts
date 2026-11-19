/** State of one item of an ingestion job (A02). */
export const JobItemStatus = {
  Pending: 'pending',
  Running: 'running',
  Done: 'done',
  Failed: 'failed',
  Dead: 'dead',
  Cancelled: 'cancelled',
} as const;
export type JobItemStatus = (typeof JobItemStatus)[keyof typeof JobItemStatus];
export const JOB_ITEM_STATUS_VALUES = Object.values(JobItemStatus) as [JobItemStatus, ...JobItemStatus[]];
