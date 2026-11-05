import { z } from 'zod';

/** Country embedded in payloads (nationality, host, birthplace). */
export const CountryRefSchema = z.object({
  iso2: z.string().length(2),
  flag: z.string().min(1),
  name: z.string().min(1),
});
export type CountryRef = z.infer<typeof CountryRefSchema>;
