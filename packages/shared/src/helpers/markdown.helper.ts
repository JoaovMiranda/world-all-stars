import { SAFE_MARKDOWN_HREF } from '../consts/markdown.const';
import type { MarkdownBlock, MarkdownDocument, MarkdownInline } from '../types/markdown.type';
import { slugify } from './text-normalize.helper';

// Small, safe markdown subset (T4.2, methodology pages): headings, paragraphs, block quotes, lists, pipe tables,
// fenced code, **strong**, *em* / _em_, `code` and [links](https://…). The output is data (no HTML string): raw HTML
// in the source stays literal text and unsafe link targets (javascript:, data:, protocol-relative…) are dropped.

const FENCE = /^\s*(```|~~~)/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const LIST_ITEM = /^\s*([-*+]|\d{1,9}[.)])\s+(.*)$/;
const ORDERED_MARKER = /^\d/;
const QUOTE = /^\s*>\s?(.*)$/;
const TABLE_ROW = /^\s*\|/;
const TABLE_SEPARATOR = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
const ESCAPABLE = /[\\`*_[\]()#+\-.!|>~]/;
const WORD_CHAR = /[\p{L}\p{N}]/u;

/** Concatenated text of inline nodes (headings ids, link labels, the document title). */
export const markdownPlainText = (inlines: readonly MarkdownInline[]): string => inlines.map((i) => i.text).join('');

const pushText = (out: MarkdownInline[], text: string) => {
  if (!text) return;
  const last = out[out.length - 1];
  if (last?.kind === 'text') last.text += text;
  else out.push({ kind: 'text', text });
};

/** Index of the closing delimiter of an emphasis run opened at `from` (or -1). */
const closingEmphasis = (src: string, delim: string, from: number): number => {
  let at = src.indexOf(delim, from);
  while (at !== -1) {
    const before = src[at - 1] ?? '';
    const after = src[at + delim.length] ?? '';
    const intraword = delim === '_' && WORD_CHAR.test(after);
    if (at > from && !/\s/.test(before) && before !== '\\' && !intraword) return at;
    at = src.indexOf(delim, at + 1);
  }
  return -1;
};

/** Inline markdown → nodes. Unknown or unbalanced markers stay literal text. */
export const parseMarkdownInline = (src: string): MarkdownInline[] => {
  const out: MarkdownInline[] = [];
  let i = 0;
  let buffer = '';
  const flush = () => {
    pushText(out, buffer);
    buffer = '';
  };
  while (i < src.length) {
    const c = src[i] as string;
    const next = src[i + 1] ?? '';
    if (c === '\\' && ESCAPABLE.test(next)) {
      buffer += next;
      i += 2;
      continue;
    }
    if (c === '`') {
      const run = /^`+/.exec(src.slice(i))?.[0] ?? '`';
      const end = src.indexOf(run, i + run.length);
      if (end !== -1) {
        flush();
        out.push({ kind: 'code', text: src.slice(i + run.length, end).replace(/^ (.*) $/s, '$1') });
        i = end + run.length;
        continue;
      }
      buffer += run;
      i += run.length;
      continue;
    }
    if (c === '*' && next === '*' && src[i + 2] && !/\s/.test(src[i + 2] as string)) {
      const end = closingEmphasis(src, '**', i + 2);
      if (end !== -1) {
        flush();
        out.push({ kind: 'strong', text: markdownPlainText(parseMarkdownInline(src.slice(i + 2, end))) });
        i = end + 2;
        continue;
      }
    }
    if ((c === '*' || c === '_') && next && !/\s/.test(next) && next !== c && !(c === '_' && WORD_CHAR.test(src[i - 1] ?? ''))) {
      const end = closingEmphasis(src, c, i + 1);
      if (end !== -1) {
        flush();
        out.push({ kind: 'em', text: markdownPlainText(parseMarkdownInline(src.slice(i + 1, end))) });
        i = end + 1;
        continue;
      }
    }
    if (c === '[') {
      const close = src.indexOf('](', i + 1);
      const end = close === -1 ? -1 : src.indexOf(')', close + 2);
      if (close !== -1 && end !== -1) {
        flush();
        const label = markdownPlainText(parseMarkdownInline(src.slice(i + 1, close)));
        const href = src.slice(close + 2, end).trim();
        if (SAFE_MARKDOWN_HREF.test(href) && !/\s/.test(href)) out.push({ kind: 'link', text: label || href, href });
        else pushText(out, label);
        i = end + 1;
        continue;
      }
    }
    buffer += c;
    i += 1;
  }
  flush();
  return out;
};

/** Cells of a pipe-table row (a `|` inside backticks or escaped with `\` does not split). */
const tableCells = (line: string): string[] => {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells: string[] = [];
  let cell = '';
  let inCode = false;
  for (let i = 0; i < trimmed.length; i += 1) {
    const c = trimmed[i] as string;
    if (c === '\\' && trimmed[i + 1] === '|') {
      cell += '\\|';
      i += 1;
    } else if (c === '`') {
      inCode = !inCode;
      cell += c;
    } else if (c === '|' && !inCode) {
      cells.push(cell.trim());
      cell = '';
    } else cell += c;
  }
  cells.push(cell.trim());
  return cells;
};

const isBlockStart = (line: string, nextLine: string | undefined) =>
  FENCE.test(line) || HEADING.test(line) || LIST_ITEM.test(line) || QUOTE.test(line) || (TABLE_ROW.test(line) && TABLE_SEPARATOR.test(nextLine ?? ''));

/**
 * Markdown document → `{ title, blocks }`. The first level-1 heading becomes `title` (the page h1); the other headings
 * map to levels 2–4 with unique slug ids (anchors).
 */
export const parseMarkdown = (source: string): MarkdownDocument => {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  const ids = new Set<string>();
  let title: string | null = null;
  let i = 0;

  const uniqueId = (text: string) => {
    const base = slugify(text) || 'section';
    let id = base;
    for (let n = 2; ids.has(id); n += 1) id = `${base}-${n}`;
    ids.add(id);
    return id;
  };

  while (i < lines.length) {
    const line = lines[i] as string;
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const fence = FENCE.exec(line);
    if (fence) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] as string).trim().startsWith(fence[1] as string)) body.push(lines[i++] as string);
      i += 1;
      blocks.push({ kind: 'code', text: body.join('\n') });
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      const level = (heading[1] as string).length;
      const content = parseMarkdownInline(heading[2] as string);
      if (level === 1 && title === null && blocks.length === 0) title = markdownPlainText(content);
      else blocks.push({ kind: 'heading', level: level <= 2 ? 2 : level === 3 ? 3 : 4, id: uniqueId(markdownPlainText(content)), content });
      i += 1;
      continue;
    }
    if (TABLE_ROW.test(line) && TABLE_SEPARATOR.test(lines[i + 1] ?? '')) {
      const header = tableCells(line);
      const rows: MarkdownInline[][][] = [];
      i += 2;
      while (i < lines.length && TABLE_ROW.test(lines[i] as string)) {
        const cells = tableCells(lines[i++] as string);
        rows.push(header.map((_, c) => parseMarkdownInline(cells[c] ?? '')));
      }
      blocks.push({ kind: 'table', header: header.map(parseMarkdownInline), rows });
      continue;
    }
    const item = LIST_ITEM.exec(line);
    if (item) {
      const ordered = ORDERED_MARKER.test(item[1] as string);
      const items: string[] = [];
      while (i < lines.length) {
        const current = lines[i] as string;
        const match = LIST_ITEM.exec(current);
        if (match && ORDERED_MARKER.test(match[1] as string) === ordered) items.push(match[2] as string);
        else if (!match && current.trim() && /^\s{2,}/.test(current) && items.length) items[items.length - 1] += ` ${current.trim()}`;
        else break;
        i += 1;
      }
      blocks.push({ kind: 'list', ordered, items: items.map(parseMarkdownInline) });
      continue;
    }
    if (QUOTE.test(line)) {
      const parts: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i] as string)) parts.push((QUOTE.exec(lines[i++] as string)?.[1] ?? '').trim());
      blocks.push({ kind: 'quote', content: parseMarkdownInline(parts.filter(Boolean).join(' ')) });
      continue;
    }
    const parts: string[] = [line.trim()];
    i += 1;
    while (i < lines.length && (lines[i] as string).trim() && !isBlockStart(lines[i] as string, lines[i + 1])) parts.push((lines[i++] as string).trim());
    blocks.push({ kind: 'paragraph', content: parseMarkdownInline(parts.join(' ')) });
  }
  return { title, blocks };
};
