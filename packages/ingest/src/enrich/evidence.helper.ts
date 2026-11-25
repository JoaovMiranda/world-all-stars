// Deterministic validation of AI output against its source (levels 2 and 3 of handoff v3 §7.2).
import { COPY_RUN_WORDS } from './evidence.const';
import type { ExtractedFact } from './extracted-fact.type';

const squash = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();

/** Level 2: the quote is copied literally from the source text (whitespace-insensitive). */
export const quoteExists = (quote: string, source: string) => squash(source).includes(squash(quote));
/** Level 3 (deterministic): the claimed value and year actually appear in the quote. */
export const quoteSupports = (fact: ExtractedFact) =>
  squash(fact.evidence_quote).includes(squash(String(fact.value))) && (fact.year === null || fact.evidence_quote.includes(String(fact.year)));

/**
 * The longest run of `text` (at least 12 consecutive words, squashed: lower case, single spaces) that also appears in
 * `source`, or null. Used to tell the model which copied words to rewrite.
 */
export const copiedRun = (text: string, source: string): string | null => {
  const words = squash(text).split(' ');
  const src = squash(source);
  let best: string | null = null;
  for (let i = 0; i + COPY_RUN_WORDS <= words.length; i++) {
    if (!src.includes(words.slice(i, i + COPY_RUN_WORDS).join(' '))) continue;
    let end = i + COPY_RUN_WORDS;
    while (end < words.length && src.includes(words.slice(i, end + 1).join(' '))) end++;
    const run = words.slice(i, end).join(' ');
    if (!best || run.length > best.length) best = run;
  }
  return best;
};

/** True when `text` reuses a run of 12+ words of `source` (the bio must be original writing). */
export const copiesSource = (text: string, source: string) => copiedRun(text, source) !== null;
