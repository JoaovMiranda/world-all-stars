import { z } from 'zod';

import { SAFE_MARKDOWN_HREF } from '../consts/markdown.const';

/**
 * Sanitized markdown as data (T4.2): the server parses a trusted-subset markdown file into these blocks and the web
 * renders them as React elements. There is no HTML node: raw HTML in the source is kept as literal text, so nothing
 * ever reaches the page through innerHTML.
 */
const text = z.string();

export const MarkdownInlineSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('text'), text }),
  z.object({ kind: z.literal('strong'), text }),
  z.object({ kind: z.literal('em'), text }),
  z.object({ kind: z.literal('code'), text }),
  z.object({ kind: z.literal('link'), text, href: z.string().regex(SAFE_MARKDOWN_HREF) }),
]);

const inlines = z.array(MarkdownInlineSchema);

export const MarkdownBlockSchema = z.discriminatedUnion('kind', [
  /** Levels 2–4 (the document title, level 1, is returned apart and becomes the page h1). */
  z.object({ kind: z.literal('heading'), level: z.union([z.literal(2), z.literal(3), z.literal(4)]), id: z.string().min(1), content: inlines }),
  z.object({ kind: z.literal('paragraph'), content: inlines }),
  z.object({ kind: z.literal('quote'), content: inlines }),
  z.object({ kind: z.literal('list'), ordered: z.boolean(), items: z.array(inlines) }),
  z.object({ kind: z.literal('table'), header: z.array(inlines), rows: z.array(z.array(inlines)) }),
  z.object({ kind: z.literal('code'), text }),
]);

export const MarkdownDocumentSchema = z.object({ title: z.string().nullable(), blocks: z.array(MarkdownBlockSchema) });
