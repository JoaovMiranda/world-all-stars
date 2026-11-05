import { z } from 'zod';

import { NOTIFICATION_KIND_VALUES } from '../enums/notification-kind.enum';
import { SESSION_KIND_VALUES } from '../enums/session-kind.enum';
import { TIER_VALUES } from '../enums/tier.enum';
import { USER_ROLE_VALUES } from '../enums/user-role.enum';
import { AthleteRefSchema } from './athlete-summary.schema';

export const SessionUserSchema = z.object({
  email: z.string().min(3),
  name: z.string().min(1),
  role: z.enum(USER_ROLE_VALUES),
  tierVotesCount: z.number().int().nonnegative(),
  commentsCount: z.number().int().nonnegative(),
});
export type SessionUser = z.infer<typeof SessionUserSchema>;

/** Response of GET /api/session: who is browsing (anon has no user). */
export const SessionResponseSchema = z.object({ kind: z.enum(SESSION_KIND_VALUES), user: SessionUserSchema.nullable() });
export type SessionResponse = z.infer<typeof SessionResponseSchema>;

/** Response of GET /api/me (E2): votes given and comments written. */
export const MeResponseSchema = z.object({
  user: SessionUserSchema,
  votes: z.array(z.object({ athlete: AthleteRefSchema, tier: z.enum(TIER_VALUES), at: z.iso.datetime() })),
  comments: z.array(z.object({ id: z.string().min(1), athlete: AthleteRefSchema, body: z.string(), at: z.iso.datetime(), isReply: z.boolean() })),
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

export const NotificationSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(NOTIFICATION_KIND_VALUES),
  read: z.boolean(),
  at: z.iso.datetime(),
  actor: z.string().nullable(),
  excerpt: z.string().nullable(),
  athlete: AthleteRefSchema.nullable(),
  commentId: z.string().nullable(),
});
export type Notification = z.infer<typeof NotificationSchema>;
/** Response of GET /api/notifications (E4). */
export const NotificationsResponseSchema = z.object({ items: z.array(NotificationSchema), unread: z.number().int().nonnegative() });
export type NotificationsResponse = z.infer<typeof NotificationsResponseSchema>;
export const NotificationIdParamsSchema = z.object({ id: z.string().min(1) });
