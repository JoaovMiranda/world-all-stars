import { WORD_SPLIT_REGEX } from '../consts/text-normalization.const';
import { BannedWordMatchMode } from '../enums/banned-word-match-mode.enum';
import type { BannedWordRule } from '../types/banned-word.type';
import { canonicalizeForModeration } from './text-normalize.helper';

/**
 * True when the text has a banned term (doc 20). Comparison without accents/case, leet undone and repeats collapsed.
 * `word` mode: whole word or expression (does not block "disputa"); `contains`: also inside other words.
 */
export const hasBannedWord = (text: string, rules: readonly BannedWordRule[]): boolean => {
  const words = text.split(WORD_SPLIT_REGEX).filter(Boolean).map(canonicalizeForModeration);
  const joined = ` ${words.join(' ')} `;
  return rules.some((rule) => {
    const term = canonicalizeForModeration(rule.term);
    if (!term) return false;
    return rule.matchMode === BannedWordMatchMode.Contains ? words.some((w) => w.includes(term)) : joined.includes(` ${term} `);
  });
};
