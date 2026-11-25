// Deterministic sentence splitter for AI sources (biography@7 / fact-check@2 cite sentences by index, never by text).
import { SENTENCE_ABBREVIATIONS } from './sentence-split.const';

/** A candidate boundary: sentence punctuation (plus closing quotes/brackets), whitespace, then a capital, digit or opening mark. */
const BOUNDARY = /[.!?]["'’”)\]]*\s+(?=["'‘“([]?[\p{Lu}\p{N}])/gu;
/** Wikipedia plain-text section headings (`== Early life ==`). */
const HEADING = /^=+[^=].*=+$/;

/** True when the period ending `before` belongs to an abbreviation or an initial, not to the end of a sentence. */
const abbreviationEnds = (before: string) => {
  const word = (before.split(/\s/).pop() ?? '').replace(/^["'‘“([]+/, '');
  if (!word.endsWith('.')) return false;
  const bare = word.slice(0, -1);
  if (/^\p{Lu}$/u.test(bare)) return true; // initial: "J. R. Smith"
  if (/^(\p{L}\.)+\p{L}$/u.test(bare)) return true; // "U.S.", "a.k.a."
  return SENTENCE_ABBREVIATIONS.has(bare.toLowerCase());
};

/** Splits one line of prose into sentences. */
const splitLine = (line: string) => {
  const out: string[] = [];
  let start = 0;
  for (const m of line.matchAll(BOUNDARY)) {
    const end = m.index + m[0].trimEnd().length;
    if (abbreviationEnds(line.slice(start, end).replace(/["'’”)\]]+$/, ''))) continue;
    out.push(line.slice(start, end).trim());
    start = m.index + m[0].length;
  }
  out.push(line.slice(start).trim());
  return out.filter((s) => s.length > 0);
};

/**
 * Splits text into sentences. Line breaks always end a sentence; blank lines and `== heading ==` lines are dropped.
 * Periods after abbreviations ("Jr.", "St.", "No."), initials ("J. R.") and inside numbers ("9.58") never split.
 * Every returned sentence is an exact substring of `text`.
 */
export const splitSentences = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !HEADING.test(l))
    .flatMap(splitLine);
