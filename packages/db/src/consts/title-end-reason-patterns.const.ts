/**
 * Free-text patterns that classify how a legacy title reign ended (universal backfill). The legacy notes were written
 * in English and Portuguese (pt-BR sources), so the Portuguese stems stay on purpose: `destitu` (stripped), `vago`
 * (vacated), `não defendeu` (did not defend), `aposent` (retired), `retornou` (returned), `derrota` (defeat).
 * Order matters: the first matching pattern wins.
 */
export const TITLE_END_REASON_PATTERNS: readonly (readonly [reason: string, pattern: RegExp])[] = [
  ['stripped', /stripped|destitu/],
  ['vacated', /vacat|vago/],
  ['abdicated', /abdic|did not defend|não defendeu/],
  ['retired', /retir|returned|aposent|retornou/],
  ['lost', /loss|lost|derrota|defeat/],
];
