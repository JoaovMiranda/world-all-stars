import type { z } from 'zod';

import type {
  AthleteRankingsResponseSchema,
  RankingDetailResponseSchema,
  RankingEntrySchema,
  RankingMethodologiesResponseSchema,
  RankingSnapshotSummarySchema,
  RankingsListResponseSchema,
} from '../schemas/ranking.schema';

export type RankingSnapshotSummary = z.infer<typeof RankingSnapshotSummarySchema>;
export type RankingsListResponse = z.infer<typeof RankingsListResponseSchema>;
export type RankingEntry = z.infer<typeof RankingEntrySchema>;
export type RankingDetailResponse = z.infer<typeof RankingDetailResponseSchema>;
export type RankingMethodologiesResponse = z.infer<typeof RankingMethodologiesResponseSchema>;
export type AthleteRankingsResponse = z.infer<typeof AthleteRankingsResponseSchema>;
