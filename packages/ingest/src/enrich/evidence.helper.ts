// Deterministic validation of AI output against its source (levels 2 and 3 of handoff v3 §7.2).
import type { ExtractedFact } from './extracted-fact.type';

const squash = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();

/** Level 2: the quote is copied literally from the source text (whitespace-insensitive). */
export const quoteExists = (quote: string, source: string) => squash(source).includes(squash(quote));
/** Level 3 (deterministic): the claimed value and year actually appear in the quote. */
export const quoteSupports = (fact: ExtractedFact) =>
  squash(fact.evidence_quote).includes(squash(String(fact.value))) && (fact.year === null || fact.evidence_quote.includes(String(fact.year)));

/** True when `text` reuses a run of 12+ words of `source` (the bio must be original writing). */
export const copiesSource = (text: string, source: string) => {
  const words = squash(text).split(' ');
  const src = squash(source);
  for (let i = 0; i + 12 <= words.length; i++) if (src.includes(words.slice(i, i + 12).join(' '))) return true;
  return false;
};
