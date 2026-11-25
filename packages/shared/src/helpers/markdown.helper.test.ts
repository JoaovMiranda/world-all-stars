import { describe, expect, it } from 'vitest';

import { MarkdownDocumentSchema } from '../schemas/markdown.schema';
import { parseMarkdown, parseMarkdownInline } from './markdown.helper';

describe('parseMarkdownInline', () => {
  it('parses strong, em, code and safe links', () => {
    expect(parseMarkdownInline('a **b** *c* _d_ `e*f` [g](https://example.org/x)')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'strong', text: 'b' },
      { kind: 'text', text: ' ' },
      { kind: 'em', text: 'c' },
      { kind: 'text', text: ' ' },
      { kind: 'em', text: 'd' },
      { kind: 'text', text: ' ' },
      { kind: 'code', text: 'e*f' },
      { kind: 'text', text: ' ' },
      { kind: 'link', text: 'g', href: 'https://example.org/x' },
    ]);
  });

  it('keeps raw HTML as literal text', () => {
    expect(parseMarkdownInline('<script>alert(1)</script> <img src=x onerror=alert(1)>')).toEqual([
      { kind: 'text', text: '<script>alert(1)</script> <img src=x onerror=alert(1)>' },
    ]);
  });

  it.each(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<b>x</b>', 'vbscript:x', '//evil.example/x', 'file:///etc/passwd'])(
    'drops the unsafe link target %s and keeps only the label',
    (href) => {
      expect(parseMarkdownInline(`[click](${href})`)).toEqual([{ kind: 'text', text: 'click' }]);
    },
  );

  it('keeps site-relative, anchor and mailto links', () => {
    expect(parseMarkdownInline('[a](/rankings) [b](#tie-breaks) [c](mailto:x@example.org)').filter((n) => n.kind === 'link')).toEqual([
      { kind: 'link', text: 'a', href: '/rankings' },
      { kind: 'link', text: 'b', href: '#tie-breaks' },
      { kind: 'link', text: 'c', href: 'mailto:x@example.org' },
    ]);
  });

  it('flattens markup inside emphasis and link labels into plain text', () => {
    expect(parseMarkdownInline('**`x` y** [**bold** label](/a)')).toEqual([
      { kind: 'strong', text: 'x y' },
      { kind: 'text', text: ' ' },
      { kind: 'link', text: 'bold label', href: '/a' },
    ]);
  });

  it('leaves unbalanced markers, intraword underscores and escapes literal', () => {
    expect(parseMarkdownInline('2 * 3 = 6, snake_case_name, \\*not em\\*, `open')).toEqual([
      { kind: 'text', text: '2 * 3 = 6, snake_case_name, *not em*, `open' },
    ]);
  });
});

describe('parseMarkdown', () => {
  const source = [
    '# Boxing — methodology v1 (`boxing`)',
    '',
    'Intro line one',
    'continues here with <b>html</b>.',
    '',
    '## Weights',
    '',
    '| Item | Points |',
    '|---|---|',
    '| World title | `a|b` 4 |',
    '| Escaped \\| pipe | 1 | extra |',
    '',
    '- first',
    '  continued',
    '- second',
    '',
    '1. one',
    '2. two',
    '',
    '> Quote **here**',
    '',
    '## Weights',
    '',
    '```',
    '<script>x</script>',
    '```',
  ].join('\n');
  const doc = parseMarkdown(source);

  it('takes the first h1 as the title and never emits an HTML node', () => {
    expect(doc.title).toBe('Boxing — methodology v1 (boxing)');
    expect(MarkdownDocumentSchema.safeParse(doc).success).toBe(true);
    expect(JSON.stringify(doc)).not.toContain('"kind":"html"');
  });

  it('builds paragraphs, tables, lists, quotes and code blocks', () => {
    expect(doc.blocks.map((b) => b.kind)).toEqual(['paragraph', 'heading', 'table', 'list', 'list', 'quote', 'heading', 'code']);
    expect(doc.blocks[0]).toEqual({ kind: 'paragraph', content: [{ kind: 'text', text: 'Intro line one continues here with <b>html</b>.' }] });
    expect(doc.blocks[2]).toEqual({
      kind: 'table',
      header: [[{ kind: 'text', text: 'Item' }], [{ kind: 'text', text: 'Points' }]],
      rows: [
        [
          [{ kind: 'text', text: 'World title' }],
          [
            { kind: 'code', text: 'a|b' },
            { kind: 'text', text: ' 4' },
          ],
        ],
        [[{ kind: 'text', text: 'Escaped | pipe' }], [{ kind: 'text', text: '1' }]],
      ],
    });
    expect(doc.blocks[3]).toEqual({ kind: 'list', ordered: false, items: [[{ kind: 'text', text: 'first continued' }], [{ kind: 'text', text: 'second' }]] });
    expect(doc.blocks[4]).toMatchObject({ kind: 'list', ordered: true });
    expect(doc.blocks[5]).toEqual({
      kind: 'quote',
      content: [
        { kind: 'text', text: 'Quote ' },
        { kind: 'strong', text: 'here' },
      ],
    });
    expect(doc.blocks[7]).toEqual({ kind: 'code', text: '<script>x</script>' });
  });

  it('gives headings unique slug ids', () => {
    expect(doc.blocks.filter((b) => b.kind === 'heading').map((b) => b.id)).toEqual(['weights', 'weights-2']);
  });
});
