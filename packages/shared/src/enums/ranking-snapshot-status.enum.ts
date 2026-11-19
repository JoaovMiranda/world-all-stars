/** Lifecycle of a ranking snapshot (E04). */
export const RankingSnapshotStatus = {
  Draft: 'draft',
  Calculated: 'calculated',
  Published: 'published',
  Archived: 'archived',
  Failed: 'failed',
} as const;
export type RankingSnapshotStatus = (typeof RankingSnapshotStatus)[keyof typeof RankingSnapshotStatus];
export const RANKING_SNAPSHOT_STATUS_VALUES = Object.values(RankingSnapshotStatus) as [RankingSnapshotStatus, ...RankingSnapshotStatus[]];
