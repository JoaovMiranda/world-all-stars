import type { NumberedCorpus } from './numbered-corpus.interface';

/**
 * Prompt for the independent biography fact-validation pass (fact-check@2): each claim (`C1`…) comes with the
 * sentence it cites; the model answers a verdict and the ID of the supporting sentence, never quoted text.
 */
export const factCheckPrompt = (claims: { text: string; evidence_id: string | null; evidence_quote: string }[], corpus: NumberedCorpus) =>
  [
    'Validate each proposed biography claim using only the numbered sentences of SOURCE ([S1] …) and FACTS ([F1] …).',
    'For every claim C1, C2 … answer "supported" when its cited sentence (or another numbered sentence) states the claim: names, years, numbers and results must match; rewording is fine.',
    'Answer "unsupported" when any part of the claim is missing from the sentences or different. Do not use outside knowledge.',
    'In "evidence" return the ID of the sentence that supports the claim (the cited one or a better one); for an unsupported claim return the cited ID. Write only the ID, never quoted text.',
    'Answer ONLY JSON with this schema: {"claims":[{"claim":"C1","evidence":"S1","status":"supported|unsupported"}]}.',
    'CLAIMS:',
    ...claims.map((c, i) => `C${i + 1}: ${c.text} — cites ${c.evidence_id ? `[${c.evidence_id}]` : 'quote'}: "${c.evidence_quote}"`),
    '--- FACTS ---',
    corpus.facts,
    '--- SOURCE ---',
    corpus.source,
  ].join('\n');
