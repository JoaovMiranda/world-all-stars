import type { MarkdownBlock } from '@was/shared';

/** Blocks under one level-2 heading of a markdown document (one card of the document layout). */
export interface MarkdownSection {
  id: string;
  title: string;
  blocks: MarkdownBlock[];
}
