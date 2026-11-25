import type { z } from 'zod';

import type {
  AthleteBandResponseSchema,
  AthleteLegacyResponseSchema,
  CrossSportEntrySchema,
  CrossSportFiltersSchema,
  CrossSportItemSchema,
  CrossSportListResponseSchema,
  CrossSportMethodologyResponseSchema,
  CrossSportUnmappedResponseSchema,
} from '../schemas/cross-sport.schema';

export type CrossSportFilters = z.output<typeof CrossSportFiltersSchema>;
export type CrossSportItemDto = z.infer<typeof CrossSportItemSchema>;
export type CrossSportEntryDto = z.infer<typeof CrossSportEntrySchema>;
export type CrossSportListResponse = z.infer<typeof CrossSportListResponseSchema>;
export type CrossSportMethodologyResponse = z.infer<typeof CrossSportMethodologyResponseSchema>;
export type AthleteBandResponse = z.infer<typeof AthleteBandResponseSchema>;
export type CrossSportUnmappedResponse = z.infer<typeof CrossSportUnmappedResponseSchema>;
export type AthleteLegacyResponse = z.infer<typeof AthleteLegacyResponseSchema>;
