import type { z } from 'zod';

import type { BannedWordSchema, ValidationContextSchema } from '../schemas/moderation-rules.schema';

export type BannedWord = z.infer<typeof BannedWordSchema>;
export type ValidationContext = z.infer<typeof ValidationContextSchema>;
