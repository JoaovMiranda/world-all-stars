import type { NumberedCorpus } from './numbered-corpus.interface';
import type { ResolvedEvidence } from './resolved-evidence.interface';
import { splitSentences } from './sentence-split.helper';
import { closestSpan } from './tolerant-match.helper';

const SENTENCE_ID = /^\[?([SF][1-9]\d*)\]?$/;

/**
 * Numbers the sentences of SOURCE (`S1`…, whole sentences up to `maxChars`) and the `; `-separated database FACTS
 * (`F1`…). The model cites these IDs; the code inserts the exact sentence, so quotes are literal by construction.
 */
export const numberCorpus = (source: string, facts: string, maxChars = 7000): NumberedCorpus => {
  const sentences = new Map<string, string>();
  let used = 0;
  for (const s of splitSentences(source)) {
    if (used + s.length > maxChars && sentences.size > 0) break;
    used += s.length + 1;
    sentences.set(`S${sentences.size + 1}`, s);
  }
  const factLines = facts
    .split(/;\s+|\n/)
    .map((f) => f.trim())
    .filter(Boolean);
  for (const [i, f] of factLines.entries()) sentences.set(`F${i + 1}`, f);
  const render = (prefix: string) =>
    [...sentences]
      .filter(([id]) => id.startsWith(prefix))
      .map(([id, s]) => `[${id}] ${s}`)
      .join('\n');
  return { ids: [...sentences.keys()], sentences, source: render('S'), facts: render('F') || '(none)', text: `${source}\n${facts}` };
};

/**
 * Resolves one piece of evidence returned by the model: a sentence ID (`S3`, `[F2]`) becomes its exact sentence; any
 * other text is kept when it is ≥ 95 % similar to a span of SOURCE/FACTS, replaced by that exact span (safety net).
 */
export const resolveEvidence = (corpus: NumberedCorpus, evidence: string): ResolvedEvidence => {
  const id = SENTENCE_ID.exec(evidence.trim())?.[1];
  if (id) return { id, quote: corpus.sentences.get(id) ?? null };
  return { id: null, quote: closestSpan(evidence, corpus.text) };
};
