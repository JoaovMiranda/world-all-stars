/** Kinds of user notifications (E4). */
export const NotificationKind = {
  CommentReply: 'comment_reply',
  SuggestionReviewed: 'suggestion_reviewed',
} as const;
export type NotificationKind = (typeof NotificationKind)[keyof typeof NotificationKind];
export const NOTIFICATION_KIND_VALUES = Object.values(NotificationKind) as [NotificationKind, ...NotificationKind[]];
