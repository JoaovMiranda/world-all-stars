import type { NumberedCorpus } from './numbered-corpus.interface';

/**
 * Biography Enricher prompt (§7.2 task 3, biography@7): original, factual text; every claim cites the ID of one
 * numbered sentence of SOURCE or FACTS (the code inserts the exact sentence as the evidence quote). `hints` are the
 * corrections of a regeneration (copied run to rewrite, unsupported claims to drop).
 */
export const biographyPrompt = (name: string, corpus: NumberedCorpus, hints: string[] = []) =>
  [
    'You write a short factual biography of the athlete below, in English (bio_en), Brazilian Portuguese (bio_pt) and Spanish (bio_es).',
    'SOURCE and FACTS are split into numbered sentences: [S1], [S2] … for SOURCE and [F1], [F2] … for FACTS. Use only facts stated in them.',
    'Step 1 — claims: pick the 3 to 6 most important facts (main titles with years, clubs or teams, position or discipline, nationality, birth). Use at most 6 claims.',
    'Each claim states exactly one fact in a short phrase, and "evidence" is the ID of the ONE sentence that states that whole fact (for example "S3" or "F2"). Write only the ID in "evidence", never quoted text.',
    'A claim must not add anything its sentence does not say: same names, years, numbers and results.',
    'Step 2 — bio_en: 3 or 4 sentences, at most 600 characters, neutral tone, built only from your claims; no superlatives unless a sentence states them.',
    'Write in your own words: the bio must not reuse any run of 12 consecutive words from SOURCE. Do not start like the first sentence of SOURCE ("X is a Brazilian former professional footballer who played as ..."); lead with the main achievement and restructure every sentence.',
    'Step 3 — bio_pt and bio_es: faithful translations of bio_en.',
    ...hints.map((h) => `CORRECTION: ${h}`),
    'Answer ONLY JSON with this schema: {"claims":[{"text":"string","evidence":"S1"}],"bio_en":"string","bio_pt":"string","bio_es":"string"}.',
    `Athlete: ${name}`,
    '--- FACTS ---',
    corpus.facts,
    '--- SOURCE ---',
    corpus.source,
  ].join('\n');
