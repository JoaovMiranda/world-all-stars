/** `word` matches whole words/expressions; `contains` also inside other words (doc 20). */
export const BannedWordMatchMode = {
  Word: 'word',
  Contains: 'contains',
} as const;
export type BannedWordMatchMode = (typeof BannedWordMatchMode)[keyof typeof BannedWordMatchMode];
export const BANNED_WORD_MATCH_MODE_VALUES = Object.values(BannedWordMatchMode) as [BannedWordMatchMode, ...BannedWordMatchMode[]];
