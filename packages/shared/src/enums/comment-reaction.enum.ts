/** One reaction per user per comment (doc 20). */
export const CommentReaction = {
  Like: 'like',
  Dislike: 'dislike',
} as const;
export type CommentReaction = (typeof CommentReaction)[keyof typeof CommentReaction];
export const COMMENT_REACTION_VALUES = Object.values(CommentReaction) as [CommentReaction, ...CommentReaction[]];
