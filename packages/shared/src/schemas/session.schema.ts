import { z } from 'zod';

import { NOTIFICATION_KIND_VALUES } from '../enums/notification-kind.enum';
import { SESSION_KIND_VALUES } from '../enums/session-kind.enum';
import { TIER_VALUES } from '../enums/tier.enum';
import { USER_ROLE_VALUES } from '../enums/user-role.enum';
import { AthleteRefSchema } from './athlete-summary.schema';

export const SessionUserSchema = z.object({
  email: z.string().min(3),
  name: z.string().min(1),
  /** Profile photo from the identity provider (Google), shown in the session menu. */
  avatarUrl: z.url().nullable().optional(),
  role: z.enum(USER_ROLE_VALUES),
  tierVotesCount: z.number().int().nonnegative(),
  commentsCount: z.number().int().nonnegative(),
});

/**
 * Response of GET /api/session: who is browsing (anon has no user).
 * - `pendingConsent`: signed in (Google) but the current Terms/Privacy (and the 18+ declaration) are not accepted yet;
 *   until then the session counts as anonymous (kind anon, user null) and the web shows the blocking consent dialog.
 * - `simulated`: the dev session switcher is available (AUTH_SIMULATED on the server; always true with fixtures).
 * - `googleEnabled`: Google sign-in is configured (GOOGLE_CLIENT_ID/SECRET); false = the login dialog says so.
 */
export const SessionResponseSchema = z.object({
  kind: z.enum(SESSION_KIND_VALUES),
  user: SessionUserSchema.nullable(),
  pendingConsent: z.object({ email: z.string().min(3), name: z.string().min(1) }).nullable(),
  simulated: z.boolean(),
  googleEnabled: z.boolean(),
});

/** Response of GET /api/me (E2): votes given and comments written. */
export const MeResponseSchema = z.object({
  user: SessionUserSchema,
  votes: z.array(z.object({ athlete: AthleteRefSchema, tier: z.enum(TIER_VALUES), at: z.iso.datetime() })),
  comments: z.array(z.object({ id: z.string().min(1), athlete: AthleteRefSchema, body: z.string(), at: z.iso.datetime(), isReply: z.boolean() })),
});

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
/** Response of GET /api/notifications (E4). */
export const NotificationsResponseSchema = z.object({ items: z.array(NotificationSchema), unread: z.number().int().nonnegative() });
export const NotificationIdParamsSchema = z.object({ id: z.string().min(1) });

/** Body of POST /api/account/consent: the versions shown in the consent dialog + the 18+ self-declaration. */
export const AcceptConsentRequestSchema = z.object({
  termsVersion: z.string().min(1),
  privacyVersion: z.string().min(1),
  adult: z.literal(true),
});

/** Consent dialog (web): both boxes start unchecked and must be ticked (Terms + Privacy; 18+). */
export const ConsentFormSchema = z.object({ documents: z.literal(true), adult: z.literal(true) });
