import { z } from 'zod';

/**
 * Building blocks of URL filter schemas: every key optional and tolerant (an invalid value is dropped instead of
 * breaking the page). Empty strings become undefined so `?q=` disappears from the URL.
 */
export const optionalText = () =>
  z
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : v))
    .optional()
    .catch(undefined);

export const optionalEnum = <const T extends readonly [string, ...string[]]>(values: T) => z.enum(values).optional().catch(undefined);
