/** Optional purposes a signed-in reader can grant or revoke at any time (doc 13, LGPD art. 8º §5º). */
export const ConsentPurpose = {
  NotificationEmails: 'notification_emails',
  AnalyticsCookies: 'analytics_cookies',
  AdCookies: 'ad_cookies',
} as const;
export type ConsentPurpose = (typeof ConsentPurpose)[keyof typeof ConsentPurpose];
export const CONSENT_PURPOSE_VALUES = Object.values(ConsentPurpose) as [ConsentPurpose, ...ConsentPurpose[]];
