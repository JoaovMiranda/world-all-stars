// Full JSON Schemas passed to Ollama's `format` (structured output): the model can only answer sentence IDs that
// exist, at most 6 claims, bounded bios, and `supported|unsupported` verdicts.

/** Sentence-ID string: one of `ids` (enum) or, with no sentences, the ID pattern. */
const sentenceId = (ids: string[]) => (ids.length ? { type: 'string', enum: ids } : { type: 'string', pattern: '^[SF][1-9][0-9]*$' });

/** biography@7 answer: claims first (each with the ID of its sentence), then the three bios. */
export const biographyJsonSchema = (ids: string[]) => ({
  type: 'object',
  properties: {
    claims: {
      type: 'array',
      minItems: 2,
      maxItems: 6,
      items: {
        type: 'object',
        properties: { text: { type: 'string', minLength: 3, maxLength: 200 }, evidence: sentenceId(ids) },
        required: ['text', 'evidence'],
      },
    },
    bio_en: { type: 'string', minLength: 40, maxLength: 900 },
    bio_pt: { type: 'string', minLength: 40, maxLength: 1000 },
    bio_es: { type: 'string', minLength: 40, maxLength: 1000 },
  },
  required: ['claims', 'bio_en', 'bio_pt', 'bio_es'],
});

/** fact-check@2 answer: exactly one verdict per claim ID, evidence sentence before the status. */
export const factCheckJsonSchema = (claimIds: string[], ids: string[]) => ({
  type: 'object',
  properties: {
    claims: {
      type: 'array',
      minItems: claimIds.length,
      maxItems: claimIds.length,
      items: {
        type: 'object',
        properties: {
          claim: { type: 'string', enum: claimIds },
          evidence: sentenceId(ids),
          status: { type: 'string', enum: ['supported', 'unsupported'] },
        },
        required: ['claim', 'evidence', 'status'],
      },
    },
  },
  required: ['claims'],
});
