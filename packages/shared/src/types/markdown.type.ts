import type { z } from 'zod';

import type { MarkdownBlockSchema, MarkdownDocumentSchema, MarkdownInlineSchema } from '../schemas/markdown.schema';

export type MarkdownInline = z.infer<typeof MarkdownInlineSchema>;
export type MarkdownBlock = z.infer<typeof MarkdownBlockSchema>;
export type MarkdownDocument = z.infer<typeof MarkdownDocumentSchema>;
