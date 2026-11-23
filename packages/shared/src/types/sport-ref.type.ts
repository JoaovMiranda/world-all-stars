import type { z } from 'zod';

import type { SportInfoSchema, SportProgrammeSchema, SportRefSchema } from '../schemas/sport-ref.schema';

export type SportRef = z.infer<typeof SportRefSchema>;
export type SportInfo = z.infer<typeof SportInfoSchema>;
export type SportProgramme = z.infer<typeof SportProgrammeSchema>;
