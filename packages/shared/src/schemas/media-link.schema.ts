import { z } from 'zod';

/** Image by link only (Commons): nothing is stored (doc 00). `url` is the thumbnail to render. */
export const MediaLinkSchema = z.object({
  url: z.url(),
  original: z.url(),
  page: z.url().nullable(),
  author: z.string().nullable(),
  license: z.string().nullable(),
  year: z.number().int().nullable(),
});
