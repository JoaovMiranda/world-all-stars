/** Ordering of comment threads (doc 20). */
export const CommentSort = {
  Top: 'top',
  Recent: 'recent',
} as const;
export type CommentSort = (typeof CommentSort)[keyof typeof CommentSort];
export const COMMENT_SORT_VALUES = Object.values(CommentSort) as [CommentSort, ...CommentSort[]];
