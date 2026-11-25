import type { z } from 'zod';

import type {
  RankingDetailSearchSchema,
  RankingFilterFieldsSchema,
  RankingFilterOptionsResponseSchema,
  RankingsListQuerySchema,
} from '../schemas/ranking-search.schema';

export type RankingFilterFields = z.infer<typeof RankingFilterFieldsSchema>;
export type RankingDetailSearch = z.infer<typeof RankingDetailSearchSchema>;
export type RankingsListQuery = z.infer<typeof RankingsListQuerySchema>;
export type RankingFilterOptionsResponse = z.infer<typeof RankingFilterOptionsResponseSchema>;
export type RankingFilterOption = RankingFilterOptionsResponse['filters'][number]['options'][number];
