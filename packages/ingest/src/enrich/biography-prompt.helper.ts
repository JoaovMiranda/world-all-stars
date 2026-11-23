/** Biography Enricher prompt (§7.2 task 3): original, factual text; every claim cites a literal quote of the source. */
export const biographyPrompt = (name: string, facts: string, section: string) =>
  [
    'You write a short factual biography (3–4 sentences, neutral tone, no unsupported superlatives) of the athlete below.',
    'Use only facts present in SOURCE or in FACTS. Write in your own words: the bio must not reuse any run of 12 consecutive words from SOURCE.',
    'Do not restate the opening sentence of SOURCE; restructure every sentence (for example lead with the main titles, not with "is a Brazilian former professional ... who played as ...").',
    'Use at most 6 claims. For every claim, copy evidence_quote character-for-character from SOURCE or FACTS; never paraphrase, translate or shorten words inside a quote.',
    'Each evidence_quote is one contiguous span of 5–40 words (at most 300 characters) copied exactly, with the same words, punctuation and numbers.',
    'Answer ONLY valid JSON matching exactly this schema: {"bio_en":"string","bio_pt":"string","bio_es":"string","claims":[{"text":"string","evidence_quote":"string"}]}.',
    `Athlete: ${name}`,
    `FACTS: ${facts}`,
    '--- SOURCE ---',
    section.slice(0, 7000),
  ].join('\n');
