import type { BannedWordMatchMode } from '../enums/banned-word-match-mode.enum';

/** A banned term (table banned_words) as needed by the validators. */
export type BannedWordRule = { term: string; matchMode: BannedWordMatchMode };
