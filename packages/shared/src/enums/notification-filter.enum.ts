/** Read-state filter of /me/notifications (E4), synced to `?filter=` (absent = all). */
export const NotificationFilter = {
  Unread: 'unread',
  Read: 'read',
} as const;
export type NotificationFilter = (typeof NotificationFilter)[keyof typeof NotificationFilter];
export const NOTIFICATION_FILTER_VALUES = Object.values(NotificationFilter) as [NotificationFilter, ...NotificationFilter[]];
