/** Read-state filter of /me/notifications (E4), synced to `?filtro=` (absent = all). */
export const NotificationFilter = {
  Unread: 'nao-lidas',
  Read: 'lidas',
} as const;
export type NotificationFilter = (typeof NotificationFilter)[keyof typeof NotificationFilter];
export const NOTIFICATION_FILTER_VALUES = Object.values(NotificationFilter) as [NotificationFilter, ...NotificationFilter[]];
