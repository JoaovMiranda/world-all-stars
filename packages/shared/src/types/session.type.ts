import type { z } from 'zod';

import type {
  AcceptConsentRequestSchema,
  ConsentFormSchema,
  MeResponseSchema,
  NotificationSchema,
  NotificationsResponseSchema,
  SessionResponseSchema,
  SessionUserSchema,
} from '../schemas/session.schema';

export type SessionUser = z.infer<typeof SessionUserSchema>;
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationsResponse = z.infer<typeof NotificationsResponseSchema>;
export type AcceptConsentRequest = z.infer<typeof AcceptConsentRequestSchema>;
export type ConsentForm = z.input<typeof ConsentFormSchema>;
