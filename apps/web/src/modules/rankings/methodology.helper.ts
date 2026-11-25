import { type MarkdownBlock, markdownPlainText } from '@was/shared';

import type { MarkdownSection } from './markdown-section.interface';

/** Splits a document at its level-2 headings: the blocks before the first one are the intro (T4.2). */
export const splitMarkdownSections = (blocks: readonly MarkdownBlock[]): { intro: MarkdownBlock[]; sections: MarkdownSection[] } => {
  const intro: MarkdownBlock[] = [];
  const sections: MarkdownSection[] = [];
  for (const block of blocks) {
    if (block.kind === 'heading' && block.level === 2) sections.push({ id: block.id, title: markdownPlainText(block.content), blocks: [] });
    else (sections.at(-1)?.blocks ?? intro).push(block);
  }
  return { intro, sections };
};
