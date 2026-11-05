/** Moderation status of a comment. */
export const CommentStatus = {
  Visible: 'visible',
  Hidden: 'hidden',
} as const;
export type CommentStatus = (typeof CommentStatus)[keyof typeof CommentStatus];
export const COMMENT_STATUS_VALUES = Object.values(CommentStatus) as [CommentStatus, ...CommentStatus[]];
