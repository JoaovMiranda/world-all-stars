import { z } from 'zod';

import { BANNED_WORD_MATCH_MODE_VALUES } from '../enums/banned-word-match-mode.enum';
import { SOURCE_USAGE_STATUS_VALUES } from '../enums/source-usage-status.enum';
import { AthleteRefSchema } from './athlete-summary.schema';
import { SportRefSchema } from './sport-ref.schema';

export const BannedWordSchema = z.object({
  term: z.string().min(1),
  matchMode: z.enum(BANNED_WORD_MATCH_MODE_VALUES),
  locale: z.string().min(2),
});
export type BannedWord = z.infer<typeof BannedWordSchema>;

/**
 * Response of GET /api/validation-context: inputs of the shared validators, so the form warns with the exact
 * server rules (comments, contact, suggestion). The server still decides.
 */
export const ValidationContextSchema = z.object({
  bannedWords: z.array(BannedWordSchema),
  sources: z.array(z.object({ name: z.string().min(1), baseUrl: z.url(), usageStatus: z.enum(SOURCE_USAGE_STATUS_VALUES) })),
  knownAthletes: z.array(AthleteRefSchema.extend({ fullName: z.string().nullable() })),
  sports: z.array(SportRefSchema),
});
export type ValidationContext = z.infer<typeof ValidationContextSchema>;
