import { parseMarkdown } from '@was/shared';
import { describe, expect, it } from 'vitest';

import { splitMarkdownSections } from './methodology.helper';

describe('splitMarkdownSections', () => {
  it('puts the blocks before the first h2 in the intro and groups the rest by h2 (h3 stay inside)', () => {
    const { blocks } = parseMarkdown('# T\n\nIntro\n\n## A `x`\n\nOne\n\n### Sub\n\nTwo\n\n## B\n\n- item');
    const { intro, sections } = splitMarkdownSections(blocks);
    expect(intro.map((b) => b.kind)).toEqual(['paragraph']);
    expect(sections.map((s) => [s.id, s.title, s.blocks.map((b) => b.kind)])).toEqual([
      ['a-x', 'A x', ['paragraph', 'heading', 'paragraph']],
      ['b', 'B', ['list']],
    ]);
  });
});
