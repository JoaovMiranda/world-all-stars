/** Review status of an athlete suggestion (doc 21). */
export const SuggestionStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  Duplicate: 'duplicate',
} as const;
export type SuggestionStatus = (typeof SuggestionStatus)[keyof typeof SuggestionStatus];
export const SUGGESTION_STATUS_VALUES = Object.values(SuggestionStatus) as [SuggestionStatus, ...SuggestionStatus[]];
