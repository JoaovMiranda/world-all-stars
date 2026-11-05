/** Leetspeak undone before comparing with banned words (doc 20). */
export const LEET_MAP: Readonly<Record<string, string>> = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' };
/** Invisible characters removed before validating text: ZWSP/ZWNJ/ZWJ, word joiner, BOM (doc 20). */
export const INVISIBLE_CHARS_REGEX = /[​-‍⁠﻿]/g;
/** Exotic spaces normalized to a plain space: NBSP, en/em spaces, narrow NBSP, ideographic space (doc 20). */
export const WIDE_SPACES_REGEX = /[  -  　]/g;
/** Separators between words when looking for banned words (keeps letters, digits and leet symbols). */
export const WORD_SPLIT_REGEX = /[^\p{L}\p{N}@$]+/u;
