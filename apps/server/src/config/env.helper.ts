import { z } from 'zod';

/** `VAR=` (empty, as in .env.example) means unset. */
export const unsetIfEmpty = <T extends z.ZodType>(schema: T) => z.preprocess((v) => (v === '' ? undefined : v), schema.optional());
