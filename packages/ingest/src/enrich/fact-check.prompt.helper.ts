/** Prompt for the independent biography fact-validation pass. */
export const factCheckPrompt = (claims: unknown, source: string, facts: string) =>
  [
    'Validate each proposed biography claim using only SOURCE and KNOWN FACTS.',
    'For every input claim return supported or unsupported. Copy evidence_quote character-for-character from the supporting material.',
    'Do not add claims, infer facts, translate evidence, or use outside knowledge.',
    'Answer ONLY valid JSON matching exactly this schema: {"claims":[{"text":"string","status":"supported|unsupported","evidence_quote":"string"}]}.',
    `PROPOSED CLAIMS: ${JSON.stringify(claims)}`,
    `KNOWN FACTS: ${facts}`,
    '--- SOURCE ---',
    source.slice(0, 7000),
  ].join('\n');
