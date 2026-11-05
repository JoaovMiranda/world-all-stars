import { z } from 'zod';

/** Where a value came from: registry source + the exact link used (provenance, ⓘ per field). */
export const SourceRefSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  license: z.string(),
  url: z.url(),
  home: z.url(),
});
export type SourceRef = z.infer<typeof SourceRefSchema>;
