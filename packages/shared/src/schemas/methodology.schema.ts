import { z } from 'zod';

import { ContentLocaleSchema } from './locale.schema';
import { MarkdownBlockSchema } from './markdown.schema';

/** `:key` of a ranking methodology (football-champions, bjj-career, boxing…). */
export const MethodologyKeyParamsSchema = z.object({ key: z.string().regex(/^[a-z0-9-]{1,64}$/) });

/** Public methodology document (T4.2): the methodology's METHODOLOGY.md parsed into sanitized blocks. */
export const MethodologyDocResponseSchema = z.object({
  key: z.string().min(1),
  version: z.string().min(1),
  /** Sport slug of the methodology (null when it spans several sports). */
  sport: z.string().nullable(),
  /** Rankings the methodology publishes (key + title), for links back to the lists. */
  rankings: z.array(z.object({ key: z.string().min(1), title: z.string().min(1) })),
  /** Title of the document (its first h1). */
  title: z.string().min(1),
  blocks: z.array(MarkdownBlockSchema),
  /** Language the document came in: the source is English; pt-BR/es only when a translation exists. */
  contentLocale: ContentLocaleSchema,
});
