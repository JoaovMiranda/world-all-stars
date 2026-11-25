// Safety net for AI quotes (T1.6): a quote that differs from the source only by typography (curly quotes, dashes,
// spacing, case, punctuation) or by a typo is replaced by the exact source span instead of failing the check.
import { TOLERANT_MATCH_THRESHOLD } from './evidence.const';

/** Lower case, NFKC, typographic quotes and dashes folded, every non-letter/digit run collapsed to one space. */
export const looseText = (s: string) =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’‚‛′`´]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/** Levenshtein distance (two rows). */
const editDistance = (a: string, b: string) => {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length]!;
};

/** 1 − edit distance / longer length, on the loose forms of both strings (1 = same text up to typography). */
export const similarity = (a: string, b: string) => {
  const x = looseText(a);
  const y = looseText(b);
  const longest = Math.max(x.length, y.length);
  return longest === 0 ? 1 : 1 - editDistance(x, y) / longest;
};

/**
 * The exact span of `source` closest to `quote` when their similarity is ≥ `threshold` (default 0.95), else null.
 * The span is cut on word boundaries (trailing `,;:` dropped), so it is always a literal substring of `source`.
 * Quotes under 3 words are never matched loosely.
 */
export const closestSpan = (quote: string, source: string, threshold = TOLERANT_MATCH_THRESHOLD): string | null => {
  const q = looseText(quote);
  const words = q.split(' ').filter(Boolean);
  if (words.length < 3) return null;
  const wanted = new Set(words);
  const tokens = [...source.matchAll(/\S+/g)].map((m) => ({ start: m.index, end: m.index + m[0].length, loose: looseText(m[0]) }));
  let best: { score: number; start: number; end: number } | null = null;
  for (let i = 0; i < tokens.length; i++) {
    if (!tokens[i]!.loose) continue;
    for (let len = Math.max(1, words.length - 3); len <= words.length + 3 && i + len <= tokens.length; len++) {
      const span = tokens.slice(i, i + len);
      const w = span
        .map((t) => t.loose)
        .filter(Boolean)
        .join(' ');
      const longest = Math.max(w.length, q.length);
      if (Math.abs(w.length - q.length) > (1 - threshold) * longest) continue;
      const shared = w.split(' ').filter((x) => wanted.has(x)).length;
      if (shared < words.length * 0.6) continue;
      const score = 1 - editDistance(w, q) / longest;
      if (score >= threshold && (!best || score > best.score)) best = { score, start: span[0]!.start, end: span[len - 1]!.end };
    }
  }
  return best ? source.slice(best.start, best.end).replace(/[,;:]+$/, '') : null;
};
