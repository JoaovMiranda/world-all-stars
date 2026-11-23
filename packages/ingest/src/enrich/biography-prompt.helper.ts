/** Biography Enricher prompt (§7.2 task 3): original, factual text; every claim cites a literal quote of the source. */
export const biographyPrompt = (name: string, facts: string, section: string) =>
  [
    'You write a short factual biography (3–4 sentences, neutral tone, no superlatives that the source does not state) of the athlete below.',
    'Write it with YOUR OWN words — never copy sentences from the text. Use only facts present in the text or in the facts list.',
    'Answer ONLY JSON: {"bio_en": "...", "bio_pt": "... (Brazilian Portuguese)", "bio_es": "... (Spanish)", "claims": [{"text": "a fact you used", "evidence_quote": "5–30 words COPIED LITERALLY from the TEXT (preferred) or from the known facts line that support it"}]}.',
    `Athlete: ${name}`,
    `Known facts (database): ${facts}`,
    '--- TEXT ---',
    section.slice(0, 7000),
  ].join('\n');
