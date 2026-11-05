/** Usage status of a data source in the registry (doc 02/21). */
export const SourceUsageStatus = {
  Active: 'active',
  PendingPermission: 'pending_permission',
  LinkOnly: 'link_only',
  Rejected: 'rejected',
} as const;
export type SourceUsageStatus = (typeof SourceUsageStatus)[keyof typeof SourceUsageStatus];
export const SOURCE_USAGE_STATUS_VALUES = Object.values(SourceUsageStatus) as [SourceUsageStatus, ...SourceUsageStatus[]];
